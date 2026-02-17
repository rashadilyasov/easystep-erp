using System.Security.Claims;
using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LicensesController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public LicensesController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var tenantId = GetTenantId();
        if (tenantId == null)
            return Ok(DefaultLicenses());

        var sub = await _db.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.TenantId == tenantId.Value && s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync(ct);

        var maxDevices = sub?.Plan.MaxDevices ?? 5;

        var devices = await _db.Devices
            .Where(d => d.TenantId == tenantId.Value)
            .OrderByDescending(d => d.LastSeenAt)
            .Select(d => new
            {
                d.Id,
                d.DeviceName,
                d.Fingerprint,
                d.LastSeenAt,
                d.Status,
            })
            .ToListAsync(ct);

        var activeCount = devices.Count(d => d.Status == DeviceStatus.Active);

        return Ok(new
        {
            activeDevices = activeCount,
            maxDevices,
            devices = devices.Select(d => new
            {
                d.Id,
                name = d.DeviceName ?? "Naməlum cihaz",
                lastSeen = d.LastSeenAt.ToString("dd.MM.yyyy HH:mm"),
                fingerprint = d.Fingerprint.Length > 8 ? d.Fingerprint[..8] + "..." : d.Fingerprint,
                d.Status,
            }),
        });
    }

    private Guid? GetTenantId()
    {
        var v = User.FindFirst("tenant_id")?.Value;
        return Guid.TryParse(v, out var id) ? id : null;
    }

    private static object DefaultLicenses() => new
    {
        activeDevices = 2,
        maxDevices = 5,
        devices = new[]
        {
            new { id = Guid.Empty, name = "Windows PC — İş masası", lastSeen = "16.02.2026 15:30", fingerprint = "a8f3b2...", status = 0 },
            new { id = Guid.Empty, name = "Windows PC — Laptop", lastSeen = "14.02.2026 10:15", fingerprint = "c4d9e1...", status = 0 },
        },
    };
}
