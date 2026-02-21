using EasyStep.Erp.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Services;

/// <summary>Hər gecə əvvəlki ay üçün partnyor bonuslarını avtomatik hesablayır və bonus almamış partnyorlara xəbərdarlıq göndərir.</summary>
public class AffiliateBonusBackgroundService : BackgroundService
{
    private readonly IServiceProvider _sp;
    private readonly ILogger<AffiliateBonusBackgroundService> _logger;
    private static readonly TimeSpan RunInterval = TimeSpan.FromHours(24);
    private static readonly TimeSpan FirstRunDelay = TimeSpan.FromMinutes(5);

    public AffiliateBonusBackgroundService(IServiceProvider sp, ILogger<AffiliateBonusBackgroundService> logger)
    {
        _sp = sp;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(FirstRunDelay, stoppingToken);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var prev = DateTime.UtcNow.AddMonths(-1);
                var year = prev.Year;
                var month = prev.Month;
                var monthStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
                var monthEnd = monthStart.AddMonths(1);

                using var scope = _sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var affiliateService = scope.ServiceProvider.GetRequiredService<AffiliateService>();
                var email = scope.ServiceProvider.GetRequiredService<IEmailService>();

                var affiliates = await db.Affiliates
                    .Include(a => a.User)
                    .Where(a => a.IsApproved && a.User != null)
                    .ToListAsync(stoppingToken);

                var count = 0;
                foreach (var aff in affiliates)
                {
                    var bonus = await affiliateService.EnsureMonthlyBonusAsync(aff.Id, year, month, stoppingToken);
                    if (bonus != null)
                    {
                        count++;
                    }
                    else
                    {
                        var customerCount = await db.AffiliateCommissions
                            .Where(c => c.AffiliateId == aff.Id && c.CreatedAt >= monthStart && c.CreatedAt < monthEnd)
                            .Select(c => c.TenantId)
                            .Distinct()
                            .CountAsync(stoppingToken);
                        if (customerCount >= 1 && customerCount < 5 && !string.IsNullOrEmpty(aff.User?.Email))
                        {
                            try
                            {
                                await email.SendAsync(
                                    aff.User.Email,
                                    $"Easy Step ERP - Bonus xəbərdarlığı ({year}-{month:D2})",
                                    $"<p>Salam.</p><p>Keçən ay ({year}-{month:D2}) {customerCount} müştəri ilə ödəniş aldınız. Bonus üçün minimum 5 müştəri tələb olunur. Bu ay daha çox müştəri cəlb etməyə çalışın.</p>",
                                    stoppingToken);
                            }
                            catch { /* ignore */ }
                        }
                    }
                }
                if (count > 0)
                    _logger.LogInformation("Affiliate bonus calculation: {Year}-{Month} - {Count} bonuses created", year, month, count);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Affiliate bonus background calculation failed");
            }
            await Task.Delay(RunInterval, stoppingToken);
        }
    }
}
