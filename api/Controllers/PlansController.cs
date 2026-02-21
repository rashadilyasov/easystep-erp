using EasyStep.Erp.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlansController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PlansController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct = default)
    {
        var plans = await _db.Plans
            .Where(p => p.IsActive)
            .OrderBy(p => p.DurationMonths)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.DurationMonths,
                p.Price,
                p.Currency,
                Popular = p.DurationMonths == 12,
            })
            .ToListAsync(ct);
        return Ok(plans);
    }
}
