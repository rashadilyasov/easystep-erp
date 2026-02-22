using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Services;

public class AffiliateService
{
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _config;
    private readonly AffiliateAbuseService? _abuse;

    public AffiliateService(ApplicationDbContext db, IConfiguration config, AffiliateAbuseService? abuse = null)
    {
        _db = db;
        _config = config;
        _abuse = abuse;
    }

    public decimal DefaultDiscountPercent => decimal.TryParse(_config["Affiliate:DefaultDiscountPercent"], out var d) ? d : 5;
    public decimal DefaultCommissionPercent => decimal.TryParse(_config["Affiliate:DefaultCommissionPercent"], out var c) ? c : 5;

    /// <summary>Admin paneldə təyin olunan varsayılanlar. Partnyor promo kod yaradanda bunlar istifadə olunur.</summary>
    public async Task<(decimal DiscountPercent, decimal CommissionPercent)> GetPromoDefaultsFromDbAsync(CancellationToken ct = default)
    {
        var sc = await _db.SiteContents.FirstOrDefaultAsync(c => c.Key == "affiliate:promoDefaults", ct);
        if (sc != null && !string.IsNullOrEmpty(sc.Value))
        {
            try
            {
                var j = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(sc.Value);
                var d = j.TryGetProperty("discountPercent", out var dp) && dp.TryGetDecimal(out var dv) ? dv : (decimal?)null;
                var c = j.TryGetProperty("commissionPercent", out var cp) && cp.TryGetDecimal(out var cv) ? cv : (decimal?)null;
                if (d.HasValue && c.HasValue && d >= 0 && d <= 100 && c >= 0 && c <= 100)
                    return (d.Value, c.Value);
            }
            catch { /* ignore */ }
        }
        return (DefaultDiscountPercent, DefaultCommissionPercent);
    }

    public async Task SavePromoDefaultsAsync(decimal discountPercent, decimal commissionPercent, CancellationToken ct = default)
    {
        var json = System.Text.Json.JsonSerializer.Serialize(new { discountPercent, commissionPercent });
        var sc = await _db.SiteContents.FirstOrDefaultAsync(c => c.Key == "affiliate:promoDefaults", ct);
        if (sc != null)
        {
            sc.Value = json;
            sc.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.SiteContents.Add(new SiteContent { Id = Guid.NewGuid(), Key = "affiliate:promoDefaults", Value = json, UpdatedAt = DateTime.UtcNow });
        }
        await _db.SaveChangesAsync(ct);
    }

    public async Task<PromoCode?> GetByCodeAsync(string code, CancellationToken ct = default)
    {
        var normalized = (code ?? "").Trim().ToUpperInvariant();
        if (string.IsNullOrEmpty(normalized)) return null;
        return await _db.PromoCodes
            .Include(p => p.Affiliate)
            .FirstOrDefaultAsync(p => p.Code == normalized && p.Status == PromoCodeStatus.Available, ct);
    }

    /// <summary>Promo kod statusu: mövcud deyil, mövcuddur/istifadə oluna bilər, artıq başqa müştəri tərəfindən istifadə olunub.</summary>
    public enum PromoCodeCheckStatus { NotFound, Available, AlreadyUsed }

    public async Task<(PromoCodeCheckStatus Status, PromoCode? Promo)> GetPromoCodeStatusAsync(string code, CancellationToken ct = default)
    {
        var normalized = (code ?? "").Trim().ToUpperInvariant();
        if (string.IsNullOrEmpty(normalized))
            return (PromoCodeCheckStatus.NotFound, null);

        var promo = await _db.PromoCodes
            .Include(p => p.Affiliate)
            .FirstOrDefaultAsync(p => p.Code == normalized, ct);

        if (promo == null)
            return (PromoCodeCheckStatus.NotFound, null);
        if (promo.Status == PromoCodeStatus.Used)
            return (PromoCodeCheckStatus.AlreadyUsed, promo);
        return (PromoCodeCheckStatus.Available, promo);
    }

    public async Task<PromoCode?> CreatePromoCodeAsync(Guid affiliateId, decimal? discountPercent, decimal? commissionPercent, CancellationToken ct = default)
    {
        var affiliate = await _db.Affiliates.FindAsync(new object[] { affiliateId }, ct);
        if (affiliate == null || !affiliate.IsApproved) return null;

        decimal discount;
        decimal commission;
        if (discountPercent.HasValue && commissionPercent.HasValue)
        {
            discount = discountPercent.Value;
            commission = commissionPercent.Value;
        }
        else
        {
            var defaults = await GetPromoDefaultsFromDbAsync(ct);
            discount = defaults.DiscountPercent;
            commission = defaults.CommissionPercent;
        }

        var code = GenerateUniqueCode();
        var promo = new PromoCode
        {
            Id = Guid.NewGuid(),
            Code = code,
            AffiliateId = affiliateId,
            DiscountPercent = discount,
            CommissionPercent = commission,
            Status = PromoCodeStatus.Available,
            CreatedAt = DateTime.UtcNow,
        };
        _db.PromoCodes.Add(promo);
        await _db.SaveChangesAsync(ct);
        try { await (_abuse?.CheckPromoFloodAsync(affiliateId, ct) ?? Task.CompletedTask); } catch { /* ignore */ }
        return promo;
    }

    public async Task<bool> UsePromoCodeForTenantAsync(string code, Guid tenantId, CancellationToken ct = default)
    {
        var promo = await GetByCodeAsync(code, ct);
        if (promo == null) return false;

        promo.TenantId = tenantId;
        promo.Status = PromoCodeStatus.Used;
        promo.UsedAt = DateTime.UtcNow;
        promo.DiscountValidUntil = DateTime.UtcNow.AddYears(1);
        await _db.SaveChangesAsync(ct);

        var tenant = await _db.Tenants.FindAsync(new object[] { tenantId }, ct);
        if (tenant != null)
        {
            tenant.PromoCodeId = promo.Id;
            await _db.SaveChangesAsync(ct);
        }
        return true;
    }

    public async Task CreateCommissionForPaymentAsync(Payment payment, CancellationToken ct = default)
    {
        var tenant = await _db.Tenants
            .Include(t => t.PromoCode)
            .FirstOrDefaultAsync(t => t.Id == payment.TenantId, ct);
        if (tenant?.PromoCodeId == null || tenant.PromoCode == null) return;

        var promo = tenant.PromoCode;
        if (promo.Status != PromoCodeStatus.Used || promo.AffiliateId == default) return;

        var amount = payment.Amount * (promo.CommissionPercent / 100);
        if (amount <= 0) return;

        var existing = await _db.AffiliateCommissions.AnyAsync(c => c.PaymentId == payment.Id, ct);
        if (existing) return;

        var commission = new AffiliateCommission
        {
            Id = Guid.NewGuid(),
            AffiliateId = promo.AffiliateId,
            TenantId = payment.TenantId,
            PaymentId = payment.Id,
            Amount = amount,
            PaymentAmount = payment.Amount,
            CommissionPercent = promo.CommissionPercent,
            Status = AffiliateCommissionStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };
        _db.AffiliateCommissions.Add(commission);

        var affiliate = await _db.Affiliates.FindAsync(new object[] { promo.AffiliateId }, ct);
        if (affiliate != null)
        {
            affiliate.BalancePending += amount;
            affiliate.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync(ct);
    }

    public const decimal BonusAmountPerMonth = 50;

    public async Task<List<Guid>> GetApprovedAffiliateIdsAsync(CancellationToken ct = default) =>
        await _db.Affiliates.Where(a => a.IsApproved).Select(a => a.Id).ToListAsync(ct);

    /// <summary>Ay üçün bonus hesabla — 5+ müştəri ödəniş etməlidir.</summary>
    public async Task<AffiliateBonus?> EnsureMonthlyBonusAsync(Guid affiliateId, int year, int month, CancellationToken ct = default)
    {
        var monthStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = monthStart.AddMonths(1);

        var customerCount = await _db.AffiliateCommissions
            .Where(c => c.AffiliateId == affiliateId && c.CreatedAt >= monthStart && c.CreatedAt < monthEnd)
            .Select(c => c.TenantId)
            .Distinct()
            .CountAsync(ct);

        var existing = await _db.AffiliateBonuses.FirstOrDefaultAsync(b => b.AffiliateId == affiliateId && b.Year == year && b.Month == month, ct);
        if (existing != null) return existing;

        if (customerCount < 5) return null;

        var bonus = new AffiliateBonus
        {
            Id = Guid.NewGuid(),
            AffiliateId = affiliateId,
            Year = year,
            Month = month,
            CustomerCount = customerCount,
            BonusAmount = BonusAmountPerMonth,
            Status = AffiliateBonusStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };
        _db.AffiliateBonuses.Add(bonus);

        var affiliate = await _db.Affiliates.FindAsync(new object[] { affiliateId }, ct);
        if (affiliate != null)
        {
            affiliate.BalanceBonus += BonusAmountPerMonth;
            affiliate.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync(ct);
        return bonus;
    }

    private static string GenerateUniqueCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var rng = new Random();
        var arr = new char[8];
        for (int i = 0; i < 8; i++)
            arr[i] = chars[rng.Next(chars.Length)];
        return new string(arr);
    }
}
