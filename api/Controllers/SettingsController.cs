using System.Security.Claims;
using EasyStep.Erp.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public SettingsController(ApplicationDbContext db) => _db = db;

    [HttpGet("tenant")]
    public async Task<IActionResult> GetTenant(CancellationToken ct)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();

        var t = await _db.Tenants.FindAsync(new object[] { tenantId.Value }, ct);
        if (t == null) return NotFound();

        return Ok(new { t.Name, t.TaxId, t.ContactPerson, t.Country, t.City });
    }

    [HttpPatch("tenant")]
    public async Task<IActionResult> UpdateTenant([FromBody] UpdateTenantRequest req, CancellationToken ct)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();

        var t = await _db.Tenants.FindAsync(new object[] { tenantId.Value }, ct);
        if (t == null) return NotFound();

        if (req.Name != null) t.Name = req.Name;
        if (req.TaxId != null) t.TaxId = req.TaxId;
        if (req.ContactPerson != null) t.ContactPerson = req.ContactPerson;
        if (req.Country != null) t.Country = req.Country;
        if (req.City != null) t.City = req.City;
        t.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Yadda saxlanıldı" });
    }

    [HttpPatch("subscription/auto-renew")]
    public async Task<IActionResult> SetAutoRenew([FromBody] AutoRenewRequest req, CancellationToken ct)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();

        var sub = await _db.Subscriptions
            .Where(s => s.TenantId == tenantId.Value && s.Status == EasyStep.Erp.Api.Entities.SubscriptionStatus.Active)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync(ct);
        if (sub == null) return NotFound(new { message = "Aktiv abunə tapılmadı" });

        sub.AutoRenew = req.Enabled;
        await _db.SaveChangesAsync(ct);
        return Ok(new { autoRenew = sub.AutoRenew });
    }

    private Guid? GetTenantId()
    {
        var v = User.FindFirst("tenant_id")?.Value;
        return Guid.TryParse(v, out var id) ? id : null;
    }
}

public record UpdateTenantRequest(string? Name, string? TaxId, string? ContactPerson, string? Country, string? City);
public record AutoRenewRequest(bool Enabled);
