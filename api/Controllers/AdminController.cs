using System.Security.Claims;
using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
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

    public AdminController(ApplicationDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken ct = default)
    {
        try
        {
            var now = DateTime.UtcNow;
            var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var totalTenants = await _db.Tenants.CountAsync(ct);
            var activeSubs = await _db.Subscriptions
                .CountAsync(s => s.Status == SubscriptionStatus.Active && s.EndDate > now, ct);
            var revenueThisMonth = await _db.Payments
                .Where(p => p.Status == PaymentStatus.Succeeded && p.CreatedAt >= monthStart)
                .SumAsync(p => p.Amount, ct);
            var openTickets = await _db.Tickets
                .CountAsync(t => t.Status == TicketStatus.Open || t.Status == TicketStatus.InProgress, ct);

            return Ok(new
            {
                totalTenants,
                activeSubscriptions = activeSubs,
                revenueThisMonth,
                openTickets,
            });
        }
        catch (Exception ex)
        {
            if (_env.IsDevelopment())
                return StatusCode(500, new { message = ex.Message, detail = ex.ToString() });
            return StatusCode(500, new { message = "Statistika yüklənə bilmədi" });
        }
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants(CancellationToken ct)
    {
        var list = await _db.Tenants
            .Select(t => new { t.Id, t.Name, t.ContactPerson, t.CreatedAt })
            .ToListAsync(ct);

        var subs = await _db.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.Status != SubscriptionStatus.Cancelled)
            .OrderByDescending(s => s.EndDate)
            .ToListAsync(ct);

        var subByTenant = subs
            .GroupBy(s => s.TenantId)
            .ToDictionary(g => g.Key, g => g.First());

        return Ok(list.Select(t => new
        {
            t.Id,
            t.Name,
            t.ContactPerson,
            createdAt = t.CreatedAt.ToString("yyyy-MM-dd"),
            subscription = subByTenant.TryGetValue(t.Id, out var sub)
                ? new { planName = sub.Plan.Name, status = sub.Status.ToString(), endDate = sub.EndDate.ToString("yyyy-MM-dd") }
                : (object?)null,
        }));
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
    public async Task<IActionResult> GetAudit([FromQuery] int limit = 100, CancellationToken ct = default)
    {
        var logs = await _db.AuditLogs
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .Select(a => new { a.Id, a.Action, a.ActorEmail, a.IpAddress, a.CreatedAt })
            .ToListAsync(ct);
        return Ok(logs.Select(a => new
        {
            a.Id,
            a.Action,
            actor = a.ActorEmail ?? "—",
            a.IpAddress,
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

}

public record ExtendRequest(int Months = 0, Guid? PlanId = null);
public record UpdateTicketStatusRequest(string Status);
public record CreatePlanRequest(string Name, int DurationMonths, decimal Price, string? Currency = "AZN", int? MaxDevices = null);
public record UpdatePlanRequest(string? Name, int? DurationMonths, decimal? Price, string? Currency, int? MaxDevices, bool? IsActive);
