using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using EasyStep.Erp.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PurchasesController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly AuditService _audit;
    private readonly ILogger<PurchasesController> _logger;

    public PurchasesController(
        ApplicationDbContext db,
        AuditService audit,
        ILogger<PurchasesController> logger)
    {
        _db = db;
        _audit = audit;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseRequest req, CancellationToken ct)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.Description))
            return BadRequest(new { error = "description_required" });

        var purchase = new Purchase
        {
            Id = Guid.NewGuid(),
            Description = req.Description.Trim(),
            Amount = req.Amount,
            RowVersion = Guid.NewGuid(),
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Purchases.Add(purchase);
        await _db.SaveChangesAsync(ct);

        try
        {
            await _audit.LogAsync("purchase.create", metadata: $"id={purchase.Id}", ct: ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Audit log failed for purchase.create (non-fatal)");
        }

        return CreatedAtAction(nameof(Get), new { id = purchase.Id }, new
        {
            purchase.Id,
            purchase.Description,
            purchase.Amount,
            purchase.RowVersion,
            purchase.CreatedAt,
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var purchase = await _db.Purchases.FindAsync(new object[] { id }, ct);
        if (purchase == null || purchase.IsDeleted)
            return NotFound(new { error = "not_found" });

        return Ok(new
        {
            purchase.Id,
            purchase.Description,
            purchase.Amount,
            purchase.RowVersion,
            purchase.CreatedAt,
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, [FromQuery] Guid rowVersion, CancellationToken ct)
    {
        var purchase = await _db.Purchases
            .Include(p => p.Files)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (purchase == null || purchase.IsDeleted)
            return Conflict(new { error = "already_deleted_or_not_found" });

        if (purchase.RowVersion != rowVersion)
            return Conflict(new { error = "row_version_mismatch" });

        // Delete associated files from disk
        foreach (var file in purchase.Files)
        {
            if (!string.IsNullOrEmpty(file.FilePath) && System.IO.File.Exists(file.FilePath))
            {
                try
                {
                    System.IO.File.Delete(file.FilePath);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "ORPHAN FILE BUG: failed to delete file {FilePath} for purchase {PurchaseId}", file.FilePath, id);
                }
            }
            _db.PurchaseFiles.Remove(file);
        }

        purchase.IsDeleted = true;
        await _db.SaveChangesAsync(ct);

        try
        {
            await _audit.LogAsync("purchase.delete", metadata: $"id={purchase.Id}", ct: ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Audit log failed for purchase.delete (non-fatal)");
        }

        return NoContent();
    }

    [HttpPost("{id:guid}/files")]
    public async Task<IActionResult> UploadFile(Guid id, IFormFile? file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "file_required" });

        var purchase = await _db.Purchases.FindAsync(new object[] { id }, ct);
        if (purchase == null || purchase.IsDeleted)
            return NotFound(new { error = "purchase_not_found" });

        var uploadsDir = Path.Combine(Path.GetTempPath(), "easystep_uploads");
        Directory.CreateDirectory(uploadsDir);

        var safeName = Path.GetFileName(file.FileName ?? "upload");
        if (string.IsNullOrWhiteSpace(safeName)) safeName = "upload";
        var filePath = Path.Combine(uploadsDir, $"{Guid.NewGuid()}_{safeName}");

        using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream, ct);
        }

        var purchaseFile = new PurchaseFile
        {
            Id = Guid.NewGuid(),
            PurchaseId = id,
            FileName = safeName,
            FilePath = filePath,
            CreatedAt = DateTime.UtcNow,
        };
        _db.PurchaseFiles.Add(purchaseFile);
        await _db.SaveChangesAsync(ct);

        try
        {
            await _audit.LogAsync("purchase.file_upload", metadata: $"purchaseId={id},fileId={purchaseFile.Id}", ct: ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Audit log failed for purchase.file_upload (non-fatal)");
        }

        return Ok(new { purchaseFile.Id, purchaseFile.FileName, purchaseFile.FilePath });
    }
}

public record CreatePurchaseRequest(string Description, decimal Amount);
