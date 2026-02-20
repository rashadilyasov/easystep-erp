using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Services;

public class AffiliateService
{
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _config;

    public AffiliateService(ApplicationDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public decimal DefaultDiscountPercent => decimal.TryParse(_config["Affiliate:DefaultDiscountPercent"], out var d) ? d : 5;
    public decimal DefaultCommissionPercent => decimal.TryParse(_config["Affiliate:DefaultCommissionPercent"], out var c) ? c : 5;

    public async Task<PromoCode?> GetByCodeAsync(string code, CancellationToken ct = default)
    {
        var normalized = (code ?? "").Trim().ToUpperInvariant();
        if (string.IsNullOrEmpty(normalized)) return null;
        return await _db.PromoCodes
            .Include(p => p.Affiliate)
            .FirstOrDefaultAsync(p => p.Code == normalized && p.Status == PromoCodeStatus.Available, ct);
    }

    public async Task<PromoCode?> CreatePromoCodeAsync(Guid affiliateId, decimal? discountPercent, decimal? commissionPercent, CancellationToken ct = default)
    {
        var affiliate = await _db.Affiliates.FindAsync(new object[] { affiliateId }, ct);
        if (affiliate == null) return null;

        var discount = discountPercent ?? DefaultDiscountPercent;
        var commission = commissionPercent ?? DefaultCommissionPercent;

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
        return promo;
    }

    public async Task<bool> UsePromoCodeForTenantAsync(string code, Guid tenantId, CancellationToken ct = default)
    {
        var promo = await GetByCodeAsync(code, ct);
        if (promo == null) return false;

        promo.TenantId = tenantId;
        promo.Status = PromoCodeStatus.Used;
        promo.UsedAt = DateTime.UtcNow;
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
