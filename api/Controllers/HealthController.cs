using EasyStep.Erp.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public HealthController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct = default)
    {
        var dbOk = false;
        try
        {
            dbOk = await _db.Database.CanConnectAsync(ct);
        }
        catch { /* ignore */ }

        var status = dbOk ? "ok" : "degraded";
        return Ok(new { status, timestamp = DateTime.UtcNow, database = dbOk ? "connected" : "error" });
    }
}
