using System.Security.Claims;
using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using EasyStep.Erp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/affiliate")]
[Authorize(Policy = "AffiliateOnly")]
public class AffiliateController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly AffiliateService _affiliate;
    private readonly AuditService _audit;

    public AffiliateController(ApplicationDbContext db, AffiliateService affiliate, AuditService audit)
    {
        _db = db;
        _affiliate = affiliate;
        _audit = audit;
    }

    private async Task<Affiliate?> GetAffiliateAsync(CancellationToken ct)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var id))
            return null;
        return await _db.Affiliates
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.UserId == id, ct);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken ct)
    {
        var aff = await GetAffiliateAsync(ct);
        if (aff == null) return Unauthorized();

        try
        {
        var activeCustomers = await _db.PromoCodes
            .CountAsync(p => p.AffiliateId == aff.Id && p.Status == PromoCodeStatus.Used, ct);

        var pendingCommissions = await _db.AffiliateCommissions
            .Where(c => c.AffiliateId == aff.Id && (c.Status == AffiliateCommissionStatus.Pending || c.Status == AffiliateCommissionStatus.Approved))
            .SumAsync(c => c.Amount, ct);

        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var thisMonthCustomerCount = await _db.AffiliateCommissions
            .Where(c => c.AffiliateId == aff.Id && c.CreatedAt >= monthStart)
            .Select(c => c.TenantId)
            .Distinct()
            .CountAsync(ct);

        var lastMonthStart = monthStart.AddMonths(-1);
        var lastMonthCommissions = await _db.AffiliateCommissions
            .Include(c => c.Tenant)
            .Where(c => c.AffiliateId == aff.Id && c.CreatedAt >= lastMonthStart && c.CreatedAt < monthStart)
            .Select(c => new { c.Amount, c.Status, c.CreatedAt, TenantName = c.Tenant != null ? c.Tenant.Name : (string?)null })
            .ToListAsync(ct);

        var thisMonthBonus = await _db.AffiliateBonuses
            .FirstOrDefaultAsync(b => b.AffiliateId == aff.Id && b.Year == now.Year && b.Month == now.Month, ct);

        var promoCodes = await _db.PromoCodes
            .Where(p => p.AffiliateId == aff.Id)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.Code,
                discountPercent = p.DiscountPercent,
                commissionPercent = p.CommissionPercent,
                status = p.Status.ToString(),
                usedAt = p.UsedAt,
                discountValidUntil = p.DiscountValidUntil,
                tenantName = p.Tenant != null ? p.Tenant.Name : null,
            })
            .ToListAsync(ct);

        return Ok(new
        {
            isApproved = aff.IsApproved,
            activeCustomers,
            thisMonthCustomerCount,
            bonusRequired = 5,
            bonusStatus = thisMonthBonus != null ? thisMonthBonus.Status.ToString() : (thisMonthCustomerCount >= 5 ? "Pending" : $"{thisMonthCustomerCount}/5 müştəri"),
            balancePending = aff.BalancePending,
            balanceTotal = aff.BalanceTotal,
            balanceBonus = aff.BalanceBonus,
            lastMonthCommissions = lastMonthCommissions.Select(c => new
            {
                c.Amount,
                status = c.Status.ToString(),
                date = c.CreatedAt.ToString("dd.MM.yyyy"),
                c.TenantName,
            }),
            promoCodes = promoCodes.Select(p => new
            {
                p.Id,
                p.Code,
                p.discountPercent,
                p.commissionPercent,
                p.status,
                p.usedAt,
                discountValidUntil = p.discountValidUntil?.ToString("dd.MM.yyyy"),
                p.tenantName,
            }),
        });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Panel məlumatları yüklənə bilmədi. Bir az sonra yenidən cəhd edin.", debug = ex.Message });
        }
    }

    [HttpGet("promo-codes")]
    public async Task<IActionResult> ListPromoCodes(CancellationToken ct)
    {
        var aff = await GetAffiliateAsync(ct);
        if (aff == null) return Unauthorized();

        var list = await _db.PromoCodes
            .Where(p => p.AffiliateId == aff.Id)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.Code,
                p.DiscountPercent,
                p.CommissionPercent,
                status = p.Status.ToString(),
                createdAt = p.CreatedAt.ToString("dd.MM.yyyy"),
                usedAt = p.UsedAt != null ? p.UsedAt.Value.ToString("dd.MM.yyyy") : null,
                tenantName = p.Tenant != null ? p.Tenant.Name : null,
            })
            .ToListAsync(ct);

        return Ok(list);
    }

    [HttpPost("promo-codes")]
    public async Task<IActionResult> CreatePromoCode([FromBody] CreatePromoCodeRequest? req, CancellationToken ct)
    {
        var aff = await GetAffiliateAsync(ct);
        if (aff == null) return Unauthorized();
        if (!aff.IsApproved)
            return BadRequest(new { message = "Qeydiyyatınız hələ admin tərəfindən təsdiqlənməyib. Promo kod yaratmaq üçün admin panelində təsdiq gözləyin." });

        try
        {
        var promo = await _affiliate.CreatePromoCodeAsync(aff.Id, null, null, ct);
        if (promo == null) return BadRequest(new { message = "Promo kod yaradıla bilmədi. Admin təsdiqini yoxlayın." });

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        await _audit.LogAsync("PromoCodeCreated", Guid.TryParse(userId, out var uid) ? uid : null, aff.User?.Email, metadata: $"code={promo.Code} affiliateId={aff.Id}", ct: ct);

        return Ok(new
        {
            id = promo.Id,
            code = promo.Code,
            discountPercent = promo.DiscountPercent,
            commissionPercent = promo.CommissionPercent,
            status = promo.Status.ToString(),
            message = "Promo kod uğurla yaradıldı",
        });
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
        {
            var inner = ex.InnerException?.Message ?? ex.Message;
            if (inner.Contains("23505") || inner.Contains("unique", StringComparison.OrdinalIgnoreCase) || inner.Contains("IX_PromoCodes_Code", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Bu kod artıq mövcuddur. Yenidən cəhd edin." });
            return BadRequest(new { message = "Promo kod yaradıla bilmədi. Bir az sonra yenidən cəhd edin." });
        }
    }

    [HttpGet("commissions")]
    public async Task<IActionResult> ListCommissions([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var aff = await GetAffiliateAsync(ct);
        if (aff == null) return Unauthorized();

        var list = await _db.AffiliateCommissions
            .Where(c => c.AffiliateId == aff.Id)
            .OrderByDescending(c => c.CreatedAt)
            .Take(limit)
            .Select(c => new
            {
                c.Id,
                c.Amount,
                c.PaymentAmount,
                c.CommissionPercent,
                status = c.Status.ToString(),
                date = c.CreatedAt.ToString("dd.MM.yyyy"),
                paidAt = c.PaidAt != null ? c.PaidAt.Value.ToString("dd.MM.yyyy") : null,
                tenantName = c.Tenant.Name,
            })
            .ToListAsync(ct);

        return Ok(list);
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings(CancellationToken ct)
    {
        var (discount, commission) = await _affiliate.GetPromoDefaultsFromDbAsync(ct);
        return Ok(new { defaultDiscountPercent = discount, defaultCommissionPercent = commission });
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var aff = await GetAffiliateAsync(ct);
        if (aff == null) return Unauthorized();

        return Ok(new
        {
            email = aff.User?.Email ?? "",
            phone = aff.User?.Phone ?? "",
            bankIban = aff.BankIban ?? "",
            bankName = aff.BankName ?? "",
            bankAccountHolder = aff.BankAccountHolder ?? "",
            payriffInfo = aff.PayriffInfo ?? "",
            commissionReceiveMethod = (int)aff.CommissionReceiveMethod,
            commissionAccountNote = aff.CommissionAccountNote ?? "",
        });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] AffiliateProfileUpdateRequest? req, CancellationToken ct)
    {
        var aff = await GetAffiliateAsync(ct);
        if (aff == null) return Unauthorized();
        if (req == null) return BadRequest(new { message = "Məlumat göndərilmədi" });

        if (req.Phone != null)
        {
            var user = await _db.Users.FindAsync(new object[] { aff.UserId }, ct);
            if (user != null)
            {
                user.Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim();
            }
        }
        if (req.BankIban != null) aff.BankIban = string.IsNullOrWhiteSpace(req.BankIban) ? null : req.BankIban.Trim();
        if (req.BankName != null) aff.BankName = string.IsNullOrWhiteSpace(req.BankName) ? null : req.BankName.Trim();
        if (req.BankAccountHolder != null) aff.BankAccountHolder = string.IsNullOrWhiteSpace(req.BankAccountHolder) ? null : req.BankAccountHolder.Trim();
        if (req.PayriffInfo != null) aff.PayriffInfo = string.IsNullOrWhiteSpace(req.PayriffInfo) ? null : req.PayriffInfo.Trim();
        if (req.CommissionReceiveMethod.HasValue) aff.CommissionReceiveMethod = (CommissionReceiveMethod)Math.Clamp(req.CommissionReceiveMethod.Value, 0, 3);
        if (req.CommissionAccountNote != null) aff.CommissionAccountNote = string.IsNullOrWhiteSpace(req.CommissionAccountNote) ? null : req.CommissionAccountNote.Trim();

        aff.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync("AffiliateProfileUpdated", aff.UserId, aff.User?.Email, metadata: $"affiliateId={aff.Id}", ct: ct);
        return Ok(new { message = "Profil yeniləndi" });
    }

    [HttpGet("reports/commissions")]
    public async Task<IActionResult> GetCommissionReports([FromQuery] int? year, [FromQuery] int? month, [FromQuery] int limit = 100, CancellationToken ct = default)
    {
        var aff = await GetAffiliateAsync(ct);
        if (aff == null) return Unauthorized();

        var query = _db.AffiliateCommissions
            .Include(c => c.Tenant).ThenInclude(t => t!.PromoCode)
            .Where(c => c.AffiliateId == aff.Id);

        if (year.HasValue) query = query.Where(c => c.CreatedAt.Year == year.Value);
        if (month.HasValue) query = query.Where(c => c.CreatedAt.Month == month.Value);

        var list = await query
            .OrderByDescending(c => c.CreatedAt)
            .Take(limit)
            .Select(c => new
            {
                c.Id,
                c.Amount,
                c.PaymentAmount,
                c.CommissionPercent,
                status = c.Status.ToString(),
                date = c.CreatedAt,
                paidAt = c.PaidAt,
                tenantName = c.Tenant.Name,
                promoCode = c.Tenant != null && c.Tenant.PromoCode != null ? c.Tenant.PromoCode.Code : (string?)null,
            })
            .ToListAsync(ct);

        return Ok(list.Select(c => new
        {
            c.Id,
            c.Amount,
            c.PaymentAmount,
            c.CommissionPercent,
            c.status,
            date = c.date.ToString("dd.MM.yyyy HH:mm"),
            paidAt = c.paidAt?.ToString("dd.MM.yyyy"),
            c.tenantName,
            promoCode = c.promoCode ?? "—",
        }));
    }

    [HttpGet("reports/payments")]
    public async Task<IActionResult> GetPaymentHistory([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var aff = await GetAffiliateAsync(ct);
        if (aff == null) return Unauthorized();

        var list = await _db.AffiliateCommissions
            .Where(c => c.AffiliateId == aff.Id && c.Status == AffiliateCommissionStatus.Paid)
            .OrderByDescending(c => c.PaidAt ?? c.CreatedAt)
            .Take(limit)
            .Select(c => new
            {
                c.Id,
                c.Amount,
                date = c.PaidAt ?? c.CreatedAt,
                tenantName = c.Tenant.Name,
                source = "Commission",
            })
            .ToListAsync(ct);

        var bonusPayments = await _db.AffiliateBonuses
            .Where(b => b.AffiliateId == aff.Id && b.Status == AffiliateBonusStatus.Paid)
            .OrderByDescending(b => b.PaidAt)
            .Take(limit)
            .Select(b => new { b.Id, b.BonusAmount, b.PaidAt, b.Year, b.Month })
            .ToListAsync(ct);

        var commissionItems = list.Select(c => new PaymentHistoryItem(c.Id.ToString(), c.Amount, c.date.ToString("dd.MM.yyyy"), c.tenantName, "Komissiya")).ToList();
        var bonusItems = bonusPayments.Select(b => new PaymentHistoryItem(b.Id.ToString(), b.BonusAmount, (b.PaidAt ?? DateTime.UtcNow).ToString("dd.MM.yyyy"), $"{b.Year}-{b.Month:00} bonus", "Bonus")).ToList();
        var combined = commissionItems.Concat(bonusItems).OrderByDescending(x => x.Date).Take(limit).ToList();
        return Ok(combined);
    }
}

public record CreatePromoCodeRequest(decimal? DiscountPercent, decimal? CommissionPercent);

public class AffiliateProfileUpdateRequest
{
    public string? Phone { get; set; }
    public string? BankIban { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountHolder { get; set; }
    public string? PayriffInfo { get; set; }
    public int? CommissionReceiveMethod { get; set; }
    public string? CommissionAccountNote { get; set; }
}

internal record PaymentHistoryItem(string Id, decimal Amount, string Date, string TenantName, string Source);
