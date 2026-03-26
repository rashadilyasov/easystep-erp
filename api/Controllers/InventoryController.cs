using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using EasyStep.Erp.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/inventory")]
public class InventoryController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly AuditService _audit;
    private readonly ILogger<InventoryController> _logger;

    public InventoryController(
        ApplicationDbContext db,
        AuditService audit,
        ILogger<InventoryController> logger)
    {
        _db = db;
        _audit = audit;
        _logger = logger;
    }

    [HttpPost("items")]
    public async Task<IActionResult> CreateItem([FromBody] CreateInventoryItemRequest req, CancellationToken ct)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { error = "name_required" });

        var item = new InventoryItem
        {
            Id = Guid.NewGuid(),
            Name = req.Name.Trim(),
            ExpectedQuantity = req.ExpectedQuantity,
            ActualQuantity = req.ActualQuantity,
        };
        _db.InventoryItems.Add(item);
        await _db.SaveChangesAsync(ct);

        try
        {
            await _audit.LogAsync("inventory.create", metadata: $"id={item.Id}", ct: ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Audit log failed for inventory.create (non-fatal)");
        }

        return CreatedAtAction(nameof(GetStockIntegrity), new { }, new
        {
            item.Id,
            item.Name,
            item.ExpectedQuantity,
            item.ActualQuantity,
        });
    }

    [HttpGet("stock-integrity")]
    public async Task<IActionResult> GetStockIntegrity(CancellationToken ct)
    {
        var mismatches = await _db.InventoryItems
            .Where(i => i.ActualQuantity != i.ExpectedQuantity)
            .Select(i => new
            {
                i.Id,
                i.Name,
                i.ExpectedQuantity,
                i.ActualQuantity,
                Difference = i.ExpectedQuantity - i.ActualQuantity,
            })
            .ToListAsync(ct);

        return Ok(new
        {
            clean = mismatches.Count == 0,
            mismatchCount = mismatches.Count,
            mismatches,
        });
    }

    [HttpPost("fix")]
    public async Task<IActionResult> Fix(CancellationToken ct)
    {
        var items = await _db.InventoryItems
            .Where(i => i.ActualQuantity != i.ExpectedQuantity)
            .ToListAsync(ct);

        foreach (var item in items)
        {
            item.ActualQuantity = item.ExpectedQuantity;
        }
        await _db.SaveChangesAsync(ct);

        try
        {
            await _audit.LogAsync("inventory.fix", metadata: $"fixed={items.Count}", ct: ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Audit log failed for inventory.fix (non-fatal)");
        }

        return Ok(new { fixed_count = items.Count, message = "Inventory reconciled" });
    }
}

public record CreateInventoryItemRequest(string Name, int ExpectedQuantity, int ActualQuantity);
