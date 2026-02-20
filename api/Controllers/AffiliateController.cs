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

    public AffiliateController(ApplicationDbContext db, AffiliateService affiliate)
    {
        _db = db;
        _affiliate = affiliate;
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

        var activeCustomers = await _db.PromoCodes
            .CountAsync(p => p.AffiliateId == aff.Id && p.Status == PromoCodeStatus.Used, ct);

        var pendingCommissions = await _db.AffiliateCommissions
            .Where(c => c.AffiliateId == aff.Id && (c.Status == AffiliateCommissionStatus.Pending || c.Status == AffiliateCommissionStatus.Approved))
            .SumAsync(c => c.Amount, ct);

        var monthStart = DateTime.UtcNow.AddMonths(-1);
        var lastMonthCommissions = await _db.AffiliateCommissions
            .Where(c => c.AffiliateId == aff.Id && c.CreatedAt >= monthStart)
            .Select(c => new { c.Amount, c.Status, c.CreatedAt, TenantName = c.Tenant.Name })
            .ToListAsync(ct);

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
                tenantName = p.Tenant != null ? p.Tenant.Name : null,
            })
            .ToListAsync(ct);

        return Ok(new
        {
            activeCustomers,
            balancePending = aff.BalancePending,
            balanceTotal = aff.BalanceTotal,
            lastMonthCommissions = lastMonthCommissions.Select(c => new
            {
                c.Amount,
                status = c.Status.ToString(),
                date = c.CreatedAt.ToString("dd.MM.yyyy"),
                c.TenantName,
            }),
            promoCodes,
        });
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

        var promo = await _affiliate.CreatePromoCodeAsync(
            aff.Id,
            req?.DiscountPercent,
            req?.CommissionPercent,
            ct);
        if (promo == null) return BadRequest(new { message = "Promo kod yaradıla bilmədi" });

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
    public IActionResult GetSettings(CancellationToken ct)
    {
        return Ok(new
        {
            defaultDiscountPercent = _affiliate.DefaultDiscountPercent,
            defaultCommissionPercent = _affiliate.DefaultCommissionPercent,
        });
    }
}

public record CreatePromoCodeRequest(decimal? DiscountPercent, decimal? CommissionPercent);
