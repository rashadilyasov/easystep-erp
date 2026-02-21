using System.Collections.Generic;
using System.Security.Claims;
using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using EasyStep.Erp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly AuthService _auth;
    private readonly IEmailService _email;
    private readonly IConfiguration _config;
    private readonly ILogger<AdminController> _logger;
    private readonly AffiliateService _affiliateService;
    private readonly AuditService _audit;
    private readonly EmailSettingsService _emailSettings;
    private readonly EmailTemplateService _emailTemplates;
    private readonly ITemplatedEmailService _templatedEmail;

    public AdminController(ApplicationDbContext db, IWebHostEnvironment env, AuthService auth, IEmailService email, ITemplatedEmailService templatedEmail, IConfiguration config, ILogger<AdminController> logger, AffiliateService affiliateService, AuditService audit, EmailSettingsService emailSettings, EmailTemplateService emailTemplates)
    {
        _db = db;
        _env = env;
        _auth = auth;
        _email = email;
        _config = config;
        _logger = logger;
        _affiliateService = affiliateService;
        _audit = audit;
        _emailSettings = emailSettings;
        _emailTemplates = emailTemplates;
        _templatedEmail = templatedEmail;
    }

    private Guid? GetAdminUserId() =>
        Guid.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) ? id : null;

    private static readonly Guid SystemTenantId = Guid.Parse("b0000000-0000-0000-0000-000000000001");
    private static readonly Guid AffiliatesTenantId = Guid.Parse("b0000000-0000-0000-0000-000000000002");

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var totalTenants = 0;
        var activeSubs = 0;
        var revenueThisMonth = 0m;
        var openTickets = 0;

        try { totalTenants = await _db.Tenants.CountAsync(t => t.Id != SystemTenantId && t.Id != AffiliatesTenantId, ct); } catch { /* ignore */ }
        try { activeSubs = await _db.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Active && s.EndDate > now, ct); } catch { /* ignore */ }
        try { revenueThisMonth = await _db.Payments.Where(p => p.Status == PaymentStatus.Succeeded && p.CreatedAt >= monthStart).SumAsync(p => p.Amount, ct); } catch { /* ignore */ }
        try { openTickets = await _db.Tickets.CountAsync(t => t.Status == TicketStatus.Open || t.Status == TicketStatus.InProgress, ct); } catch { /* ignore */ }

        return Ok(new { totalTenants, activeSubscriptions = activeSubs, revenueThisMonth, openTickets });
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants(CancellationToken ct)
    {
        var list = await _db.Tenants
            .Where(t => t.Id != SystemTenantId && t.Id != AffiliatesTenantId)
            .Select(t => new { t.Id, t.Name, t.ContactPerson, t.CreatedAt })
            .ToListAsync(ct);

        var tenantIds = list.Select(t => t.Id).ToList();
        var subs = await _db.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.Status != SubscriptionStatus.Cancelled)
            .OrderByDescending(s => s.EndDate)
            .ToListAsync(ct);

        var users = await _db.Users
            .Where(u => tenantIds.Contains(u.TenantId))
            .Select(u => new { u.Id, u.TenantId, u.Email, u.EmailVerified, u.CreatedAt })
            .ToListAsync(ct);

        var usersByTenant = list.ToDictionary(t => t.Id, t => users.Where(u => u.TenantId == t.Id).ToList());
        var subByTenant = subs.GroupBy(s => s.TenantId).ToDictionary(g => g.Key, g => g.First());

        return Ok(list.Select(t => new
        {
            t.Id,
            t.Name,
            t.ContactPerson,
            createdAt = t.CreatedAt.ToString("yyyy-MM-dd"),
            subscription = subByTenant.TryGetValue(t.Id, out var sub)
                ? new { planName = sub.Plan.Name, status = sub.Status.ToString(), endDate = sub.EndDate.ToString("yyyy-MM-dd") }
                : (object?)null,
            users = usersByTenant[t.Id].Select(u => new { u.Id, u.Email, u.EmailVerified, createdAt = u.CreatedAt.ToString("yyyy-MM-dd") }),
        }));
    }

    [HttpPost("users/{userId:guid}/verify-email")]
    public async Task<IActionResult> VerifyUserEmail(Guid userId, CancellationToken ct)
    {
        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        if (user == null) return NotFound(new { message = "İstifadəçi tapılmadı" });
        user.EmailVerified = true;
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "E-poçt təsdiqləndi" });
    }

    [HttpPost("users/{userId:guid}/resend-verification-email")]
    public async Task<IActionResult> ResendVerificationEmail(Guid userId, CancellationToken ct)
    {
        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        if (user == null) return NotFound(new { message = "İstifadəçi tapılmadı" });
        var token = await _auth.CreateEmailVerificationTokenForUserAsync(userId, ct);
        if (token == null) return StatusCode(500, new { message = "Token yaradıla bilmədi" });

        var baseUrl = _config["App:BaseUrl"] ?? "https://www.easysteperp.com";
        var verifyUrl = $"{baseUrl}/verify-email?token={Uri.EscapeDataString(token)}";
        var to = user.Email;
        _ = Task.Run(async () =>
        {
            try { await _templatedEmail.SendTemplatedAsync(to, EmailTemplateKeys.Verification, new Dictionary<string, string> { ["verifyUrl"] = verifyUrl }, CancellationToken.None); }
            catch (Exception ex) { _logger.LogError(ex, "Resend verification email failed for {To}", to); }
        });
        return Ok(new { message = "Təsdiq linki e-poçtuna göndərildi" });
    }

    [HttpGet("tenants/{tenantId:guid}")]
    public async Task<IActionResult> GetTenantDetail(Guid tenantId, CancellationToken ct)
    {
        var tenant = await _db.Tenants.FindAsync(new object[] { tenantId }, ct);
        if (tenant == null) return NotFound(new { message = "Tenant tapılmadı" });

        List<object> usersList;
        object? subscriptionData = null;
        List<object> paymentsList;
        List<object> ticketsList;

        try
        {
            usersList = (await _db.Users.Where(u => u.TenantId == tenantId)
                .Select(u => new { u.Id, u.Email, u.EmailVerified, u.CreatedAt, u.LastLoginAt, u.Role })
                .ToListAsync(ct))
                .Select(u => (object)new { u.Id, u.Email, u.EmailVerified, u.CreatedAt, u.LastLoginAt, role = u.Role.ToString() }).ToList();
        }
        catch (Exception ex) { _logger.LogWarning(ex, "GetTenantDetail users failed"); usersList = new List<object>(); }

        try
        {
            var sub = await _db.Subscriptions.Include(s => s.Plan)
                .Where(s => s.TenantId == tenantId && s.Status != SubscriptionStatus.Cancelled)
                .OrderByDescending(s => s.EndDate).FirstOrDefaultAsync(ct);
            if (sub?.Plan != null)
                subscriptionData = new { name = sub.Plan.Name, status = sub.Status.ToString(), endDate = sub.EndDate.ToString("yyyy-MM-dd") };
        }
        catch (Exception ex) { _logger.LogWarning(ex, "GetTenantDetail subscription failed"); }

        try
        {
            paymentsList = (await _db.Payments.Where(p => p.TenantId == tenantId)
                .OrderByDescending(p => p.CreatedAt).Take(20)
                .Select(p => new { p.Id, p.Amount, p.Currency, p.Status, p.Provider, p.CreatedAt })
                .ToListAsync(ct))
                .Select(p => (object)new { p.Id, p.Amount, p.Currency, status = p.Status.ToString(), p.Provider, date = p.CreatedAt.ToString("yyyy-MM-dd HH:mm") }).ToList();
        }
        catch (Exception ex) { _logger.LogWarning(ex, "GetTenantDetail payments failed"); paymentsList = new List<object>(); }

        try
        {
            ticketsList = (await _db.Tickets.Where(t => t.TenantId == tenantId)
                .OrderByDescending(t => t.CreatedAt).Take(10)
                .Select(t => new { t.Id, t.Subject, t.Status, t.CreatedAt })
                .ToListAsync(ct))
                .Select(t => (object)new { t.Id, t.Subject, t.Status, date = t.CreatedAt.ToString("yyyy-MM-dd HH:mm") }).ToList();
        }
        catch (Exception ex) { _logger.LogWarning(ex, "GetTenantDetail tickets failed"); ticketsList = new List<object>(); }

        return Ok(new
        {
            tenant = new { tenant.Id, tenant.Name, tenant.ContactPerson, tenant.TaxId, tenant.Country, tenant.City, tenant.CreatedAt },
            users = usersList,
            subscription = subscriptionData,
            payments = paymentsList,
            tickets = ticketsList,
        });
    }

    [HttpPatch("users/{userId:guid}")]
    public async Task<IActionResult> UpdateUser(Guid userId, [FromBody] AdminUpdateUserRequest req, CancellationToken ct)
    {
        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        if (user == null) return NotFound(new { message = "İstifadəçi tapılmadı" });
        if (req.Email != null)
        {
            if (await _db.Users.AnyAsync(u => u.Email == req.Email && u.Id != userId, ct))
                return BadRequest(new { message = "Bu e-poçt artıq istifadə olunur" });
            user.Email = req.Email.Trim();
        }
        if (req.Phone != null) user.Phone = req.Phone.Trim();
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "İstifadəçi yeniləndi" });
    }

    [HttpDelete("users/{userId:guid}")]
    public async Task<IActionResult> DeleteUser(Guid userId, CancellationToken ct)
    {
        var user = await _db.Users.Include(u => u.Tenant).FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null) return NotFound(new { message = "İstifadəçi tapılmadı" });
        if (user.Role == UserRole.SuperAdmin)
            return BadRequest(new { message = "SuperAdmin silinə bilməz" });

        _db.Users.Remove(user);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "İstifadəçi silindi" });
    }

    [HttpPost("delete-tenant")]
    public async Task<IActionResult> DeleteTenantByBody([FromBody] DeleteTenantRequest req, CancellationToken ct)
    {
        if (req?.TenantId == null) return BadRequest(new { message = "TenantId tələb olunur" });
        return await DeleteTenantCore(req.TenantId.Value, ct);
    }

    [HttpPost("tenants/{tenantId:guid}/remove")]
    [HttpPost("tenants/{tenantId:guid}/delete")]
    [HttpDelete("tenants/{tenantId:guid}")]
    public async Task<IActionResult> DeleteTenant(Guid tenantId, CancellationToken ct)
    {
        return await DeleteTenantCore(tenantId, ct);
    }

    private async Task<IActionResult> DeleteTenantCore(Guid tenantId, CancellationToken ct)
    {
        var exists = await _db.Tenants.AnyAsync(t => t.Id == tenantId, ct);
        if (!exists) return NotFound(new { message = "Tenant tapılmadı" });
        var tenant = await _db.Tenants.Where(t => t.Id == tenantId).Select(t => new { t.Name }).FirstAsync(ct);
        if (tenant?.Name?.Contains("System") == true || tenant?.Name == "Affiliates")
            return BadRequest(new { message = "Sistem tenantləri silinə bilməz" });

        var userIds = await _db.Users.Where(u => u.TenantId == tenantId).Select(u => u.Id).ToListAsync(ct);
        async Task TryDelete(Func<Task> act) { try { await act(); } catch { /* cədvəl yoxdursa keç */ } }

        await TryDelete(() => _db.RefreshTokens.Where(r => userIds.Contains(r.UserId)).ExecuteDeleteAsync(ct));
        await TryDelete(() => _db.EmailVerificationTokens.Where(t => userIds.Contains(t.UserId)).ExecuteDeleteAsync(ct));
        await TryDelete(() => _db.PasswordResetTokens.Where(t => userIds.Contains(t.UserId)).ExecuteDeleteAsync(ct));
        await TryDelete(() => _db.EmailOtpCodes.Where(o => userIds.Contains(o.UserId)).ExecuteDeleteAsync(ct));
        await TryDelete(() => _db.AffiliateCommissions.Where(c => c.TenantId == tenantId).ExecuteDeleteAsync(ct));
        await TryDelete(() => _db.Invoices.Where(i => i.TenantId == tenantId).ExecuteDeleteAsync(ct));
        await TryDelete(() => _db.Payments.Where(p => p.TenantId == tenantId).ExecuteDeleteAsync(ct));
        await TryDelete(() => _db.Subscriptions.Where(s => s.TenantId == tenantId).ExecuteDeleteAsync(ct));
        await TryDelete(() => _db.Tickets.Where(t => t.TenantId == tenantId).ExecuteDeleteAsync(ct));
        await TryDelete(() => _db.Devices.Where(d => d.TenantId == tenantId).ExecuteDeleteAsync(ct));
        await TryDelete(() => _db.Users.Where(u => u.TenantId == tenantId).ExecuteDeleteAsync(ct));
        await TryDelete(() => _db.Tenants.Where(t => t.Id == tenantId).ExecuteDeleteAsync(ct));

        return Ok(new { message = "Tenant silindi" });
    }

    [HttpPost("tenants/{id:guid}/extend")]
    public async Task<IActionResult> ExtendSubscription(Guid id, [FromBody] ExtendRequest? req, CancellationToken ct)
    {
        var r = req ?? new ExtendRequest();
        var tenantExists = await _db.Tenants.AnyAsync(t => t.Id == id, ct);
        if (!tenantExists) return NotFound(new { message = "Tenant tapılmadı" });

        var sub = await _db.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.TenantId == id)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync(ct);

        if (sub == null)
        {
            var planId = r.PlanId ?? Guid.Parse("a0000001-0001-0001-0001-000000000004");
            var plan = await _db.Plans.FindAsync(new object[] { planId }, ct);
            if (plan == null) return BadRequest(new { message = "Plan tapılmadı" });
            var start = DateTime.UtcNow;
            _db.Subscriptions.Add(new Subscription
            {
                Id = Guid.NewGuid(),
                TenantId = id,
                PlanId = plan.Id,
                Status = SubscriptionStatus.Active,
                StartDate = start,
                EndDate = start.AddMonths(plan.DurationMonths),
                AutoRenew = false,
            });
        }
        else
        {
            var months = r.Months > 0 ? r.Months : (sub.Plan?.DurationMonths ?? 1);
            var newEnd = (sub.EndDate > DateTime.UtcNow ? sub.EndDate : DateTime.UtcNow).AddMonths(months);
            sub.EndDate = newEnd;
            sub.Status = SubscriptionStatus.Active;
        }

        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Abunə uzatıldı" });
    }

    [HttpGet("audit")]
    public async Task<IActionResult> GetAudit([FromQuery] int limit = 100, [FromQuery] bool abuseOnly = false, CancellationToken ct = default)
    {
        var query = _db.AuditLogs.AsQueryable();
        if (abuseOnly)
            query = query.Where(a => a.Action.StartsWith("AbuseSuspected"));
        var logs = await query
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .Select(a => new { a.Id, a.Action, a.ActorEmail, a.IpAddress, a.Metadata, a.CreatedAt })
            .ToListAsync(ct);
        return Ok(logs.Select(a => new
        {
            a.Id,
            a.Action,
            actor = a.ActorEmail ?? "—",
            a.IpAddress,
            a.Metadata,
            date = a.CreatedAt.ToString("dd.MM.yyyy HH:mm"),
        }));
    }

    [HttpGet("tickets")]
    public async Task<IActionResult> GetTickets([FromQuery] int limit = 100, CancellationToken ct = default)
    {
        var list = await _db.Tickets
            .OrderByDescending(t => t.CreatedAt)
            .Take(limit)
            .Select(t => new { t.Id, t.Subject, t.Body, t.Status, t.CreatedAt, t.TenantId })
            .ToListAsync(ct);

        var tenantIds = list.Select(t => t.TenantId).Distinct().ToList();
        var tenants = await _db.Tenants.Where(x => tenantIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, ct);

        return Ok(list.Select(t => new
        {
            t.Id,
            t.Subject,
            body = t.Body.Length > 200 ? t.Body[..200] + "..." : t.Body,
            status = t.Status.ToString(),
            date = t.CreatedAt.ToString("dd.MM.yyyy HH:mm"),
            tenantName = tenants.TryGetValue(t.TenantId, out var tn) ? tn.Name : "—",
        }));
    }

    [HttpGet("tickets/{id:guid}")]
    public async Task<IActionResult> GetTicket(Guid id, CancellationToken ct)
    {
        var ticket = await _db.Tickets
            .Where(t => t.Id == id)
            .Select(t => new { t.Id, t.Subject, t.Body, t.Status, t.CreatedAt, t.TenantId })
            .FirstOrDefaultAsync(ct);
        if (ticket == null)
            return NotFound(new { message = "Bilet tapılmadı" });

        var tenant = await _db.Tenants
            .Where(x => x.Id == ticket.TenantId)
            .Select(x => x.Name)
            .FirstOrDefaultAsync(ct);

        return Ok(new
        {
            ticket.Id,
            ticket.Subject,
            ticket.Body,
            status = ticket.Status.ToString(),
            date = ticket.CreatedAt.ToString("dd.MM.yyyy HH:mm"),
            tenantName = tenant ?? "—",
        });
    }

    [HttpPatch("tickets/{id:guid}/status")]
    public async Task<IActionResult> UpdateTicketStatus(Guid id, [FromBody] UpdateTicketStatusRequest req, CancellationToken ct)
    {
        var ticket = await _db.Tickets.FindAsync(new object[] { id }, ct);
        if (ticket == null)
            return NotFound(new { message = "Bilet tapılmadı" });

        if (!Enum.TryParse<TicketStatus>(req.Status, true, out var status))
            return BadRequest(new { message = "Geçərsiz status" });

        ticket.Status = status;
        ticket.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Ok(new { status = ticket.Status.ToString(), message = "Status yeniləndi" });
    }

    [HttpGet("contacts")]
    public async Task<IActionResult> GetContacts([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var list = await _db.ContactMessages
            .OrderByDescending(c => c.CreatedAt)
            .Take(limit)
            .Select(c => new { c.Id, c.Name, c.Email, c.Message, c.CreatedAt })
            .ToListAsync(ct);
        return Ok(list.Select(c => new { c.Id, c.Name, c.Email, c.Message, date = c.CreatedAt.ToString("dd.MM.yyyy HH:mm") }));
    }

    [HttpGet("plans")]
    public async Task<IActionResult> GetPlans(CancellationToken ct = default)
    {
        var plans = await _db.Plans
            .OrderBy(p => p.DurationMonths)
            .Select(p => new { p.Id, p.Name, p.DurationMonths, p.Price, p.Currency, p.MaxDevices, p.IsActive, p.CreatedAt })
            .ToListAsync(ct);
        return Ok(plans.Select(p => new
        {
            p.Id,
            p.Name,
            p.DurationMonths,
            p.Price,
            p.Currency,
            p.MaxDevices,
            p.IsActive,
            createdAt = p.CreatedAt.ToString("yyyy-MM-dd"),
        }));
    }

    [HttpPost("plans")]
    public async Task<IActionResult> CreatePlan([FromBody] CreatePlanRequest req, CancellationToken ct)
    {
        var plan = new Plan
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            DurationMonths = req.DurationMonths,
            Price = req.Price,
            Currency = req.Currency ?? "AZN",
            MaxDevices = req.MaxDevices,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Plans.Add(plan);
        await _db.SaveChangesAsync(ct);
        return Ok(new { id = plan.Id, message = "Plan yaradıldı" });
    }

    [HttpPatch("plans/{id:guid}")]
    public async Task<IActionResult> UpdatePlan(Guid id, [FromBody] UpdatePlanRequest req, CancellationToken ct)
    {
        var plan = await _db.Plans.FindAsync(new object[] { id }, ct);
        if (plan == null)
            return NotFound(new { message = "Plan tapılmadı" });

        if (req.Name != null) plan.Name = req.Name;
        if (req.DurationMonths.HasValue) plan.DurationMonths = req.DurationMonths.Value;
        if (req.Price.HasValue) plan.Price = req.Price.Value;
        if (req.Currency != null) plan.Currency = req.Currency;
        if (req.MaxDevices != null) plan.MaxDevices = req.MaxDevices;
        if (req.IsActive.HasValue) plan.IsActive = req.IsActive.Value;

        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Plan yeniləndi" });
    }

    [HttpDelete("plans/{id:guid}")]
    public async Task<IActionResult> DeletePlan(Guid id, CancellationToken ct)
    {
        var plan = await _db.Plans.FindAsync(new object[] { id }, ct);
        if (plan == null)
            return NotFound(new { message = "Plan tapılmadı" });

        var hasSubs = await _db.Subscriptions.AnyAsync(s => s.PlanId == id, ct);
        if (hasSubs)
        {
            plan.IsActive = false;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Plan deaktivləşdirildi (abunələr mövcuddur)" });
        }

        _db.Plans.Remove(plan);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Plan silindi" });
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments([FromQuery] int limit = 100, CancellationToken ct = default)
    {
        var payments = await _db.Payments
            .Include(p => p.Tenant)
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.CreatedAt,
                p.Amount,
                p.Currency,
                p.Status,
                p.Provider,
                p.TransactionId,
                tenantName = p.Tenant.Name,
            })
            .ToListAsync(ct);

        return Ok(payments.Select(p => new
        {
            p.Id,
            date = p.CreatedAt.ToString("dd.MM.yyyy HH:mm"),
            p.tenantName,
            p.Amount,
            p.Currency,
            status = p.Status.ToString(),
            p.Provider,
            p.TransactionId,
        }));
    }

    [HttpGet("affiliate-stats")]
    public async Task<IActionResult> GetAffiliateStats(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var totalPartners = await _db.Affiliates.CountAsync(ct);
        var totalPending = await _db.Affiliates.SumAsync(a => a.BalancePending, ct);
        var totalPaid = await _db.Affiliates.SumAsync(a => a.BalanceTotal, ct);
        var pendingCount = await _db.AffiliateCommissions.CountAsync(c => c.Status == AffiliateCommissionStatus.Pending, ct);
        var thisMonthPaid = await _db.AffiliateCommissions
            .Where(c => c.Status == AffiliateCommissionStatus.Paid && c.PaidAt >= monthStart)
            .SumAsync(c => c.Amount, ct);

        return Ok(new
        {
            totalPartners,
            totalPending = Math.Round(totalPending, 2),
            totalPaid = Math.Round(totalPaid, 2),
            pendingCount,
            thisMonthPaid = Math.Round(thisMonthPaid, 2),
        });
    }

    [HttpGet("affiliates")]
    public async Task<IActionResult> GetAffiliates(CancellationToken ct = default)
    {
        var list = await _db.Affiliates
            .Include(a => a.User)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id,
                a.UserId,
                email = a.User.Email,
                a.IsApproved,
                a.BalanceTotal,
                a.BalancePending,
                a.BalanceBonus,
                createdAt = a.User.CreatedAt,
            })
            .ToListAsync(ct);
        var promoCounts = await _db.PromoCodes
            .Where(p => p.Status == PromoCodeStatus.Used)
            .GroupBy(p => p.AffiliateId)
            .Select(g => new { AffiliateId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.AffiliateId, x => x.Count, ct);
        return Ok(list.Select(a => new
        {
            a.Id,
            a.UserId,
            a.email,
            isApproved = a.IsApproved,
            balanceTotal = a.BalanceTotal,
            balancePending = a.BalancePending,
            balanceBonus = a.BalanceBonus,
            createdAt = a.createdAt.ToString("dd.MM.yyyy"),
            activeCustomers = promoCounts.GetValueOrDefault(a.Id, 0),
        }));
    }

    [HttpPost("affiliates/{id:guid}/approve")]
    public async Task<IActionResult> ApproveAffiliate(Guid id, CancellationToken ct)
    {
        var aff = await _db.Affiliates.Include(a => a.User).FirstOrDefaultAsync(a => a.Id == id, ct);
        if (aff == null) return NotFound(new { message = "Partnyor tapılmadı" });
        if (aff.IsApproved) return BadRequest(new { message = "Artıq təsdiqlənib" });

        aff.IsApproved = true;
        aff.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync("AffiliateApproved", GetAdminUserId(), User.Identity?.Name, metadata: $"affiliateId={id}", ct: ct);
        try
        {
            var email = aff.User?.Email;
            var baseUrl = _config["App:BaseUrl"] ?? "https://www.easysteperp.com";
            var panelUrl = $"{baseUrl}/affiliate";
            if (!string.IsNullOrEmpty(email))
                await _templatedEmail.SendTemplatedAsync(email, EmailTemplateKeys.AffiliateApproved, new Dictionary<string, string> { ["affiliatePanelUrl"] = panelUrl }, ct);
        }
        catch { /* ignore email errors */ }
        return Ok(new { message = "Partnyor təsdiqləndi" });
    }

    [HttpGet("promo-codes")]
    public async Task<IActionResult> GetPromoCodes([FromQuery] Guid? affiliateId, [FromQuery] string? status, [FromQuery] int limit = 200, CancellationToken ct = default)
    {
        var query = _db.PromoCodes
            .Include(p => p.Affiliate).ThenInclude(a => a.User)
            .Include(p => p.Tenant)
            .AsQueryable();
        if (affiliateId.HasValue)
            query = query.Where(p => p.AffiliateId == affiliateId.Value);
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<PromoCodeStatus>(status, true, out var st))
            query = query.Where(p => p.Status == st);

        var list = await query.OrderByDescending(p => p.CreatedAt).Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Code,
                p.DiscountPercent,
                p.CommissionPercent,
                p.Status,
                p.CreatedAt,
                p.UsedAt,
                p.DiscountValidUntil,
                affiliateEmail = p.Affiliate.User.Email,
                tenantName = p.Tenant != null ? p.Tenant.Name : null,
            })
            .ToListAsync(ct);
        return Ok(list.Select(p => new
        {
            p.Id,
            p.Code,
            p.DiscountPercent,
            p.CommissionPercent,
            status = p.Status.ToString(),
            createdAt = p.CreatedAt.ToString("dd.MM.yyyy HH:mm"),
            usedAt = p.UsedAt?.ToString("dd.MM.yyyy HH:mm"),
            discountValidUntil = p.DiscountValidUntil?.ToString("dd.MM.yyyy"),
            p.affiliateEmail,
            p.tenantName,
        }));
    }

    [HttpGet("affiliate-commissions")]
    public async Task<IActionResult> GetAffiliateCommissions([FromQuery] string? status, [FromQuery] Guid? affiliateId, [FromQuery] int limit = 100, CancellationToken ct = default)
    {
        var query = _db.AffiliateCommissions
            .Include(c => c.Affiliate).ThenInclude(a => a.User)
            .Include(c => c.Tenant)
            .AsQueryable();
        if (affiliateId.HasValue)
            query = query.Where(c => c.AffiliateId == affiliateId.Value);
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<AffiliateCommissionStatus>(status, true, out var st))
            query = query.Where(c => c.Status == st);

        var list = await query
            .OrderByDescending(c => c.CreatedAt)
            .Take(limit)
            .Select(c => new
            {
                c.Id,
                c.Amount,
                c.PaymentAmount,
                c.CommissionPercent,
                c.Status,
                c.CreatedAt,
                c.ApprovedAt,
                c.PaidAt,
                affiliateEmail = c.Affiliate.User.Email,
                tenantName = c.Tenant.Name,
            })
            .ToListAsync(ct);

        return Ok(list.Select(c => new
        {
            c.Id,
            c.Amount,
            c.PaymentAmount,
            c.CommissionPercent,
            status = c.Status.ToString(),
            date = c.CreatedAt.ToString("dd.MM.yyyy HH:mm"),
            approvedAt = c.ApprovedAt?.ToString("dd.MM.yyyy"),
            paidAt = c.PaidAt?.ToString("dd.MM.yyyy"),
            c.affiliateEmail,
            c.tenantName,
        }));
    }

    [HttpPost("affiliate-commissions/{id:guid}/approve")]
    public async Task<IActionResult> ApproveCommission(Guid id, CancellationToken ct)
    {
        var c = await _db.AffiliateCommissions.FindAsync(new object[] { id }, ct);
        if (c == null) return NotFound(new { message = "Komissiya tapılmadı" });
        if (c.Status != AffiliateCommissionStatus.Pending)
            return BadRequest(new { message = "Yalnız Pending komissiyalar təsdiqlənə bilər" });

        c.Status = AffiliateCommissionStatus.Approved;
        c.ApprovedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Komissiya təsdiqləndi" });
    }

    [HttpPost("affiliate-commissions/{id:guid}/pay")]
    public async Task<IActionResult> PayCommission(Guid id, CancellationToken ct)
    {
        var c = await _db.AffiliateCommissions
            .Include(x => x.Affiliate)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c == null) return NotFound(new { message = "Komissiya tapılmadı" });
        if (c.Status != AffiliateCommissionStatus.Approved && c.Status != AffiliateCommissionStatus.Pending)
            return BadRequest(new { message = "Komissiya ödənişə hazır deyil" });

        c.Status = AffiliateCommissionStatus.Paid;
        c.PaidAt = DateTime.UtcNow;
        c.Affiliate.BalanceTotal += c.Amount;
        c.Affiliate.BalancePending -= c.Amount;
        c.Affiliate.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync("CommissionPaid", GetAdminUserId(), User.Identity?.Name, metadata: $"commissionId={id} amount={c.Amount} affiliateId={c.AffiliateId}", ct: ct);
        return Ok(new { message = "Ödəniş tamamlandı" });
    }

    [HttpPost("affiliate-commissions/payout-batch")]
    public async Task<IActionResult> PayoutBatch([FromBody] PayoutBatchRequest req, CancellationToken ct)
    {
        var ids = req.CommissionIds ?? Array.Empty<Guid>();
        var paid = 0;
        foreach (var id in ids)
        {
            var c = await _db.AffiliateCommissions
                .Include(x => x.Affiliate)
                .FirstOrDefaultAsync(x => x.Id == id, ct);
            if (c != null && (c.Status == AffiliateCommissionStatus.Approved || c.Status == AffiliateCommissionStatus.Pending))
            {
                c.Status = AffiliateCommissionStatus.Paid;
                c.PaidAt = DateTime.UtcNow;
                c.Affiliate.BalanceTotal += c.Amount;
                c.Affiliate.BalancePending -= c.Amount;
                c.Affiliate.UpdatedAt = DateTime.UtcNow;
                paid++;
            }
        }
        await _db.SaveChangesAsync(ct);
        if (paid > 0)
            await _audit.LogAsync("CommissionPayoutBatch", GetAdminUserId(), User.Identity?.Name, metadata: $"paid={paid} count={ids.Length}", ct: ct);
        return Ok(new { message = $"{paid} komissiya ödənildi", paid });
    }

    // --- Bonus idarəsi ---
    [HttpGet("affiliate-bonuses")]
    public async Task<IActionResult> GetAffiliateBonuses([FromQuery] Guid? affiliateId, [FromQuery] int? year, [FromQuery] int? month, [FromQuery] string? status, [FromQuery] int limit = 100, CancellationToken ct = default)
    {
        var query = _db.AffiliateBonuses.Include(b => b.Affiliate).ThenInclude(a => a.User).AsQueryable();
        if (affiliateId.HasValue) query = query.Where(b => b.AffiliateId == affiliateId.Value);
        if (year.HasValue) query = query.Where(b => b.Year == year.Value);
        if (month.HasValue) query = query.Where(b => b.Month == month.Value);
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<AffiliateBonusStatus>(status, true, out var st))
            query = query.Where(b => b.Status == st);

        var list = await query.OrderByDescending(b => b.Year).ThenByDescending(b => b.Month).Take(limit)
            .Select(b => new { b.Id, b.AffiliateId, affiliateEmail = b.Affiliate.User.Email, b.Year, b.Month, b.CustomerCount, b.BonusAmount, b.Status, b.CreatedAt, b.ApprovedAt, b.PaidAt })
            .ToListAsync(ct);
        return Ok(list.Select(b => new
        {
            b.Id,
            b.AffiliateId,
            b.affiliateEmail,
            b.Year,
            b.Month,
            period = $"{b.Year:D4}-{b.Month:D2}",
            b.CustomerCount,
            b.BonusAmount,
            status = b.Status.ToString(),
            createdAt = b.CreatedAt.ToString("dd.MM.yyyy"),
            approvedAt = b.ApprovedAt?.ToString("dd.MM.yyyy"),
            paidAt = b.PaidAt?.ToString("dd.MM.yyyy"),
        }));
    }

    [HttpPost("affiliate-bonuses/calculate")]
    public async Task<IActionResult> CalculateMonthlyBonuses([FromQuery] int year, [FromQuery] int month, CancellationToken ct = default)
    {
        var affiliates = await _db.Affiliates.Where(a => a.IsApproved).Select(a => a.Id).ToListAsync(ct);
        var count = 0;
        foreach (var id in affiliates)
        {
            var bonus = await _affiliateService.EnsureMonthlyBonusAsync(id, year, month, ct);
            if (bonus != null) count++;
        }
        return Ok(new { message = $"{count} partnyor üçün bonus yaradıldı/yoxlanıldı", calculated = count });
    }

    [HttpPost("affiliate-bonuses/{id:guid}/approve")]
    public async Task<IActionResult> ApproveBonus(Guid id, CancellationToken ct)
    {
        var b = await _db.AffiliateBonuses.FindAsync(new object[] { id }, ct);
        if (b == null) return NotFound(new { message = "Bonus tapılmadı" });
        if (b.Status != AffiliateBonusStatus.Pending)
            return BadRequest(new { message = "Yalnız Pending bonus təsdiqlənə bilər" });
        b.Status = AffiliateBonusStatus.Approved;
        b.ApprovedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Bonus təsdiqləndi" });
    }

    [HttpPost("affiliate-bonuses/{id:guid}/pay")]
    public async Task<IActionResult> PayBonus(Guid id, CancellationToken ct)
    {
        var b = await _db.AffiliateBonuses.Include(x => x.Affiliate).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (b == null) return NotFound(new { message = "Bonus tapılmadı" });
        if (b.Status != AffiliateBonusStatus.Approved && b.Status != AffiliateBonusStatus.Pending)
            return BadRequest(new { message = "Bonus ödənişə hazır deyil" });
        b.Status = AffiliateBonusStatus.Paid;
        b.PaidAt = DateTime.UtcNow;
        b.Affiliate.BalanceTotal += b.BonusAmount;
        b.Affiliate.BalanceBonus -= b.BonusAmount;
        b.Affiliate.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync("BonusPaid", GetAdminUserId(), User.Identity?.Name, metadata: $"bonusId={id} amount={b.BonusAmount} affiliateId={b.AffiliateId} period={b.Year}-{b.Month}", ct: ct);
        return Ok(new { message = "Bonus ödənildi" });
    }

    // --- E-poçt ayarları və şablonlar ---
    [HttpGet("email-settings")]
    public async Task<IActionResult> GetEmailSettings(CancellationToken ct = default)
    {
        var s = await _emailSettings.GetSmtpForAdminAsync(ct);
        return Ok(s);
    }

    [HttpPut("email-settings")]
    public async Task<IActionResult> PutEmailSettings([FromBody] EmailSettingsRequest req, CancellationToken ct = default)
    {
        var config = new SmtpConfig
        {
            Host = req.Host ?? "",
            Port = req.Port > 0 ? req.Port : 587,
            User = req.User ?? "",
            From = req.From ?? "hello@easysteperp.com",
            UseSsl = req.UseSsl,
        };
        await _emailSettings.SaveSmtpAsync(config, req.Password, ct);
        return Ok(new { message = "SMTP ayarları saxlanıldı" });
    }

    [HttpGet("email-templates")]
    public IActionResult ListEmailTemplates()
    {
        var list = new[]
        {
            (EmailTemplateKeys.Verification, "E-poçt təsdiqi (müştəri qeydiyyatı)"),
            (EmailTemplateKeys.AffiliateVerification, "Partnyor e-poçt təsdiqi"),
            (EmailTemplateKeys.PasswordReset, "Şifrə sıfırlama"),
            (EmailTemplateKeys.LoginOtp, "2FA daxil olma kodu"),
            (EmailTemplateKeys.TwoFaConfirm, "2FA təsdiq kodu"),
            (EmailTemplateKeys.TwoFaDisable, "2FA söndürmə kodu"),
            (EmailTemplateKeys.AffiliateApproved, "Partnyor təsdiqi"),
            (EmailTemplateKeys.BonusReminder, "Bonus xəbərdarlığı"),
            (EmailTemplateKeys.PaymentConfirm, "Ödəniş təsdiqi"),
            (EmailTemplateKeys.Notification, "Ümumi bildiriş"),
        };
        return Ok(list.Select(x => new { key = x.Item1, label = x.Item2 }));
    }

    [HttpGet("email-templates/by-key")]
    public async Task<IActionResult> GetEmailTemplate([FromQuery] string key, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(key)) return BadRequest();
        var t = await _emailTemplates.GetRawTemplateAsync(key, ct);
        return Ok(t ?? new { subject = "", body = "", from = (string?)null });
    }

    [HttpPut("email-templates/by-key")]
    public async Task<IActionResult> PutEmailTemplate([FromQuery] string key, [FromBody] EmailTemplateRequest req, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(key) || req == null) return BadRequest();
        await _emailTemplates.SaveTemplateAsync(key, req.Subject ?? "", req.Body ?? "", req.From, ct);
        return Ok(new { message = "Şablon saxlanıldı" });
    }

    [HttpPost("email-bulk-send")]
    public async Task<IActionResult> BulkSendEmail([FromBody] BulkEmailRequest req, CancellationToken ct = default)
    {
        if (req?.Emails == null || req.Emails.Count == 0)
            return BadRequest(new { message = "Ən azı bir e-poçt daxil edin" });
        if (string.IsNullOrWhiteSpace(req.Subject))
            return BadRequest(new { message = "Mövzu tələb olunur" });
        if (string.IsNullOrWhiteSpace(req.Body))
            return BadRequest(new { message = "Mətn tələb olunur" });

        var sent = 0;
        var failed = 0;
        foreach (var to in req.Emails.Where(e => !string.IsNullOrWhiteSpace(e)).Select(e => e!.Trim()).Distinct())
        {
            var ok = await _email.SendAsync(to, req.Subject.Trim(), req.Body, from: null, ct);
            if (ok) sent++; else failed++;
        }
        return Ok(new { message = $"{sent} e-poçt göndərildi", sent, failed });
    }
}

public record EmailSettingsRequest(string? Host, int Port, string? User, string? Password, string? From, bool UseSsl = true);
public record EmailTemplateRequest(string? Subject, string? Body, string? From);
public record BulkEmailRequest(List<string>? Emails, string? Subject, string? Body);

public record DeleteTenantRequest(Guid? TenantId);
public record PayoutBatchRequest(Guid[]? CommissionIds);
public record ExtendRequest(int Months = 0, Guid? PlanId = null);
public record AdminUpdateUserRequest(string? Email, string? Phone);
public record UpdateTicketStatusRequest(string Status);
public record CreatePlanRequest(string Name, int DurationMonths, decimal Price, string? Currency = "AZN", int? MaxDevices = null);
public record UpdatePlanRequest(string? Name, int? DurationMonths, decimal? Price, string? Currency, int? MaxDevices, bool? IsActive);
