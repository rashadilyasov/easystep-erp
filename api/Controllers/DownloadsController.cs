using EasyStep.Erp.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DownloadsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _config;

    public DownloadsController(ApplicationDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    /// <summary>10 dəqiqə etibarlı yükləmə linki. Subscription aktiv olmalıdır.</summary>
    [HttpGet("{id:guid}/url")]
    public async Task<IActionResult> GetSignedUrl(Guid id, CancellationToken ct)
    {
        var tenantId = User.FindFirst("tenant_id")?.Value;
        if (string.IsNullOrEmpty(tenantId) || !Guid.TryParse(tenantId, out var tid))
            return Unauthorized();
        var now = DateTime.UtcNow;
        var hasActive = await _db.Subscriptions.AnyAsync(
            s => s.TenantId == tid &&
                (s.Status == EasyStep.Erp.Api.Entities.SubscriptionStatus.Active ||
                 s.Status == EasyStep.Erp.Api.Entities.SubscriptionStatus.PastDue) &&
                s.EndDate.AddDays(7) >= now,
            ct);
        if (!hasActive)
            return Forbid();

        var release = await _db.Releases.FindAsync(new object[] { id }, ct);
        if (release == null) return NotFound();
        var exp = DateTimeOffset.UtcNow.AddMinutes(10).ToUnixTimeSeconds();
        var payload = $"{id}:{exp}";
        var token = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(payload));
        var apiBase = _config["App:ApiBaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        return Ok(new { url = $"{apiBase}/api/downloads/{id}/file?t={Uri.EscapeDataString(token)}", expiresIn = 600 });
    }

    [HttpGet("{id:guid}/file")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> DownloadFile(Guid id, [FromQuery] string t, CancellationToken ct)
    {
        var release = await _db.Releases.FindAsync(new object[] { id }, ct);
        if (release == null) return NotFound();
        try
        {
            var decoded = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(t));
            var parts = decoded.Split(':');
            if (parts.Length != 2 || parts[0] != id.ToString()) return BadRequest();
            if (!long.TryParse(parts[1], out var exp) || DateTimeOffset.UtcNow.ToUnixTimeSeconds() > exp)
                return BadRequest("Linkin müddəti bitib");
        }
        catch
        {
            return BadRequest();
        }
        return Redirect(release.FileUrl);
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var releases = await _db.Releases
            .OrderByDescending(r => r.PublishedAt)
            .Take(20)
            .Select(r => new
            {
                r.Id,
                r.Version,
                r.FileUrl,
                r.Sha256,
                r.Notes,
                r.IsLatest,
                r.PublishedAt,
            })
            .ToListAsync(ct);

        if (releases.Count == 0)
            return Ok(DefaultReleases());

        return Ok(releases.Select(r => new
        {
            r.Id,
            version = r.Version,
            fileUrl = r.FileUrl,
            sha256 = r.Sha256 != null ? r.Sha256[..Math.Min(12, r.Sha256.Length)] + "..." : null,
            notes = r.Notes,
            isLatest = r.IsLatest,
            publishedAt = r.PublishedAt.ToString("dd.MM.yyyy"),
        }));
    }

    private static object DefaultReleases() => new[]
    {
        new { id = Guid.Empty, version = "1.2.0", fileUrl = "#", sha256 = "a1b2c3...", notes = "Yeni modullar, performans təkmilləşdirmələri", isLatest = true, publishedAt = "16.02.2026" },
        new { id = Guid.Empty, version = "1.1.0", fileUrl = "#", sha256 = "", notes = "", isLatest = false, publishedAt = "01.01.2026" },
    };
}
