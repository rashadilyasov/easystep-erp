using EasyStep.Erp.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EasyStep.Erp.Api.Controllers;

/// <summary>Railway və digər cron provayderləri üçün — xüsusi secret ilə çağrılır.</summary>
[ApiController]
[Route("api/cron")]
public class CronController : ControllerBase
{
    private readonly AffiliateService _affiliate;
    private readonly IConfiguration _config;

    public CronController(AffiliateService affiliate, IConfiguration config)
    {
        _affiliate = affiliate;
        _config = config;
    }

    /// <summary>Əvvəlki ay üçün bonus hesabla. Header: X-Cron-Secret və ya ?secret=</summary>
    [HttpPost("bonus-calculate")]
    [HttpGet("bonus-calculate")]
    public async Task<IActionResult> BonusCalculate(CancellationToken ct)
    {
        var secret = Request.Headers["X-Cron-Secret"].FirstOrDefault()
            ?? Request.Query["secret"].FirstOrDefault();
        var expected = _config["Cron:Secret"] ?? _config["Cron_Secret"] ?? Environment.GetEnvironmentVariable("CRON_SECRET");
        if (string.IsNullOrEmpty(expected) || secret != expected)
            return Unauthorized(new { message = "Invalid or missing cron secret" });

        var prev = DateTime.UtcNow.AddMonths(-1);
        var year = prev.Year;
        var month = prev.Month;

        var affiliates = await _affiliate.GetApprovedAffiliateIdsAsync(ct);
        var count = 0;
        foreach (var id in affiliates)
        {
            var bonus = await _affiliate.EnsureMonthlyBonusAsync(id, year, month, ct);
            if (bonus != null) count++;
        }
        return Ok(new { message = $"{count} bonus yaradıldı/yoxlanıldı", year, month, calculated = count });
    }
}
