using System.Security.Claims;
using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using EasyStep.Erp.Api.Services;
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
    private readonly AuthService _auth;
    private readonly IConfiguration _config;
    private readonly ITemplatedEmailService _email;

    public SettingsController(ApplicationDbContext db, AuthService auth, IConfiguration config, ITemplatedEmailService email)
    {
        _db = db;
        _auth = auth;
        _config = config;
        _email = email;
    }

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

    [HttpPost("invite")]
    [Authorize(Roles = "CustomerAdmin,SuperAdmin")]
    public async Task<IActionResult> InviteUser([FromBody] InviteUserRequest req, CancellationToken ct)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();

        var email = (req.Email ?? "").Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(email) || !email.Contains("@"))
            return BadRequest(new { message = "Düzgün e-poçt daxil edin." });

        if (await _db.Users.AnyAsync(u => u.Email.ToLower() == email, ct))
            return BadRequest(new { message = "Bu e-poçt artıq qeydiyyatdadır." });

        var role = req.Role == "CustomerAdmin" ? UserRole.CustomerAdmin : UserRole.CustomerUser;

        var token = _auth.GenerateInviteToken(tenantId.Value, email, role);
        var baseUrl = _config["App:BaseUrl"] ?? "https://www.easysteperp.com";
        var inviteUrl = $"{baseUrl}/invite?token={Uri.EscapeDataString(token)}";

        var tenant = await _db.Tenants.FindAsync(new object[] { tenantId.Value }, ct);
        var inviterEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "";
        var inviterUser = await _db.Users.Include(u => u.Tenant).FirstOrDefaultAsync(u => u.Email == inviterEmail, ct);
        var inviterName = (inviterUser?.Tenant?.ContactPerson ?? "Admin").Trim();
        if (string.IsNullOrEmpty(inviterName)) inviterName = "İstifadəçi";
        var tenantName = tenant?.Name ?? "Şirkət";

        _ = Task.Run(async () =>
        {
            try
            {
                await _email.SendTemplatedAsync(email, EmailTemplateKeys.UserInvite,
                    new Dictionary<string, string>
                    {
                        ["inviterName"] = inviterName,
                        ["tenantName"] = tenantName,
                        ["inviteUrl"] = inviteUrl,
                    }, CancellationToken.None);
            }
            catch { /* log in production */ }
        });

        return Ok(new { message = "Dəvət göndərildi", inviteUrl });
    }

    private Guid? GetTenantId()
    {
        var v = User.FindFirst("tenant_id")?.Value;
        return Guid.TryParse(v, out var id) ? id : null;
    }
}

public record InviteUserRequest(string Email, string Role);

public record UpdateTenantRequest(string? Name, string? TaxId, string? ContactPerson, string? Country, string? City);
public record AutoRenewRequest(bool Enabled);
