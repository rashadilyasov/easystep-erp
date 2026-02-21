using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Services;

/// <summary>Sui-istifadə aşkarlanması: promo flood, şübhəli fəaliyyət.</summary>
public class AffiliateAbuseService
{
    private readonly ApplicationDbContext _db;
    private readonly AuditService _audit;
    private readonly ILogger<AffiliateAbuseService> _logger;

    private const int PromoCodesPerHourThreshold = 15;
    private const int PromoCodesPerDayThreshold = 50;

    public AffiliateAbuseService(ApplicationDbContext db, AuditService audit, ILogger<AffiliateAbuseService> logger)
    {
        _db = db;
        _audit = audit;
        _logger = logger;
    }

    /// <summary>Promo kod yaradıldıqdan sonra çağrılır — flood yoxlaması.</summary>
    public async Task CheckPromoFloodAsync(Guid affiliateId, CancellationToken ct = default)
    {
        var hourAgo = DateTime.UtcNow.AddHours(-1);
        var dayAgo = DateTime.UtcNow.AddDays(-1);

        var countHour = await _db.PromoCodes.CountAsync(p => p.AffiliateId == affiliateId && p.CreatedAt >= hourAgo, ct);
        var countDay = await _db.PromoCodes.CountAsync(p => p.AffiliateId == affiliateId && p.CreatedAt >= dayAgo, ct);

        if (countHour >= PromoCodesPerHourThreshold)
        {
            var aff = await _db.Affiliates.Include(a => a.User).FirstOrDefaultAsync(a => a.Id == affiliateId, ct);
            var email = aff?.User?.Email ?? "?";
            await _audit.LogAsync("AbuseSuspected_PromoFlood", affiliateId, email, metadata: $"count1h={countHour} count24h={countDay} affiliateId={affiliateId}", ct: ct);
            _logger.LogWarning("Abuse suspected: Affiliate {AffiliateId} ({Email}) created {Count} promo codes in 1 hour", affiliateId, email, countHour);
        }
        else if (countDay >= PromoCodesPerDayThreshold)
        {
            var aff = await _db.Affiliates.Include(a => a.User).FirstOrDefaultAsync(a => a.Id == affiliateId, ct);
            var email = aff?.User?.Email ?? "?";
            await _audit.LogAsync("AbuseSuspected_PromoFlood", affiliateId, email, metadata: $"count24h={countDay} affiliateId={affiliateId}", ct: ct);
            _logger.LogWarning("Abuse suspected: Affiliate {AffiliateId} ({Email}) created {Count} promo codes in 24 hours", affiliateId, email, countDay);
        }
    }
}
