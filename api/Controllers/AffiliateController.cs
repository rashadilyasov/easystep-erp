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
}

public record CreatePromoCodeRequest(decimal? DiscountPercent, decimal? CommissionPercent);
