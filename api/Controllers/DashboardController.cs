using System.Security.Claims;
using EasyStep.Erp.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public DashboardController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var tenantIdClaim = User.FindFirst("tenant_id")?.Value;
        if (string.IsNullOrEmpty(tenantIdClaim) || !Guid.TryParse(tenantIdClaim, out var tenantId))
        {
            return Ok(DefaultDashboard());
        }

        var sub = await _db.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.TenantId == tenantId && s.Status == EasyStep.Erp.Api.Entities.SubscriptionStatus.Active)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync(ct);

        if (sub == null)
            return Ok(DefaultDashboard());

        var daysLeft = (int)(sub.EndDate - DateTime.UtcNow).TotalDays;
        return Ok(new
        {
            plan = new { name = sub.Plan.Name, endDate = sub.EndDate.ToString("yyyy-MM-dd") },
            daysLeft = Math.Max(0, daysLeft),
            status = sub.Status.ToString(),
            autoRenew = sub.AutoRenew,
        });
    }

    private static object DefaultDashboard()
    {
        var endDate = DateTime.UtcNow.AddMonths(12);
        var daysLeft = Math.Max(0, (int)(endDate - DateTime.UtcNow).TotalDays);
        return new
        {
            plan = new { name = "Əla 12 ay", endDate = endDate.ToString("yyyy-MM-dd") },
            daysLeft,
            status = "Active",
            autoRenew = true,
        };
    }
}
