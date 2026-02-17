using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LicenseController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public LicenseController(ApplicationDbContext db) => _db = db;

    /// <summary>
    /// Desktop proqram tərəfindən istifadə olunur. Subscription statusunu qaytarır.
    /// </summary>
    [HttpPost("validate")]
    public async Task<IActionResult> Validate([FromBody] ValidateRequest req, CancellationToken ct)
    {
        if (req.TenantId == null)
            return Ok(DefaultResponse());

        var sub = await _db.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.TenantId == req.TenantId.Value && s.Status != SubscriptionStatus.Cancelled)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync(ct);

        if (sub == null)
            return Ok(new ValidateResponse
            {
                Status = "Expired",
                TenantId = req.TenantId.Value,
                ExpiresAt = DateTime.UtcNow,
                OfflineGraceUntil = DateTime.UtcNow,
                EnforceMode = "read-only"
            });

        var now = DateTime.UtcNow;
        var graceEnd = sub.EndDate.AddDays(7);
        string status;
        if (sub.Status == SubscriptionStatus.Active && sub.EndDate >= now)
            status = "Active";
        else if (sub.EndDate < now && graceEnd >= now)
            status = "PastDue";
        else if (sub.Status == SubscriptionStatus.Expired || sub.Status == SubscriptionStatus.Suspended)
            status = sub.Status.ToString();
        else
            status = sub.EndDate >= now ? "Active" : "Expired";

        return Ok(new ValidateResponse
        {
            Status = status,
            TenantId = req.TenantId.Value,
            ExpiresAt = sub.EndDate,
            OfflineGraceUntil = graceEnd,
            EnforceMode = "read-only"
        });
    }

    private static ValidateResponse DefaultResponse() => new()
    {
        Status = "Active",
        TenantId = Guid.Empty,
        ExpiresAt = DateTime.UtcNow.AddMonths(1),
        OfflineGraceUntil = DateTime.UtcNow.AddDays(7),
        EnforceMode = "read-only"
    };

    /// <summary>
    /// Desktop login-dən sonra device-bound token alır.
    /// </summary>
    [HttpPost("issue")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public IActionResult Issue([FromBody] IssueRequest req)
    {
        return Ok(new
        {
            token = "mock-device-token",
            expiresAt = DateTime.UtcNow.AddDays(1)
        });
    }

    [HttpPost("revoke-device")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> RevokeDevice([FromBody] RevokeDeviceRequest req, CancellationToken ct)
    {
        var device = await _db.Devices.FindAsync(new object[] { req.DeviceId }, ct);
        if (device == null)
            return NotFound(new { message = "Cihaz tapılmadı" });
        device.Status = DeviceStatus.Deactivated;
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Cihaz deaktiv edildi" });
    }
}

public record ValidateRequest(string? LicenseKey, Guid? TenantId, string? DeviceFingerprint);

public class ValidateResponse
{
    public string Status { get; set; } = string.Empty; // Active | PastDue | Expired | Suspended
    public Guid TenantId { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime OfflineGraceUntil { get; set; }
    public string EnforceMode { get; set; } = "read-only"; // read-only | block
}

public record IssueRequest(string DeviceFingerprint, string? DeviceName);

public record RevokeDeviceRequest(Guid DeviceId);
