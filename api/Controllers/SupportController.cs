using System.Security.Claims;
using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[EnableRateLimiting("support")]
public class SupportController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public SupportController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();

        var tickets = await _db.Tickets
            .Where(t => t.TenantId == tenantId.Value)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new { t.Id, t.Subject, t.Status, t.CreatedAt })
            .ToListAsync(ct);

        return Ok(tickets.Select(t => new
        {
            t.Id,
            t.Subject,
            status = t.Status.ToString(),
            date = t.CreatedAt.ToString("dd.MM.yyyy"),
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTicketRequest req, CancellationToken ct)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();
        if (tenantId == null || userId == null) return Unauthorized();
        if (string.IsNullOrWhiteSpace(req?.Subject) || string.IsNullOrWhiteSpace(req?.Body))
            return BadRequest(new { message = "Mövzu və təsvir vacibdir" });
        if ((req.Subject?.Length ?? 0) > 500 || (req.Body?.Length ?? 0) > 10000)
            return BadRequest(new { message = "Mətn həddindən artıq uzundur" });

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId.Value,
            CreatedByUserId = userId.Value,
            Subject = req.Subject,
            Body = req.Body,
            Status = TicketStatus.Open,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.Tickets.Add(ticket);
        await _db.SaveChangesAsync(ct);

        return Ok(new { id = ticket.Id, message = "Bilet açıldı" });
    }

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".pdf", ".doc", ".docx", ".txt", ".log", ".png", ".jpg", ".jpeg" };

    private static string SanitizeFileName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "fayl";
        var baseName = Path.GetFileName(name);
        if (string.IsNullOrEmpty(baseName)) return "fayl";
        baseName = baseName.Replace("..", "").Trim();
        if (baseName.Length > 128) baseName = baseName[..128];
        var ext = Path.GetExtension(baseName);
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
            baseName = Path.GetFileNameWithoutExtension(baseName) + ".bin";
        return string.IsNullOrWhiteSpace(baseName) ? "fayl" : baseName;
    }

    [HttpPost("tickets/{ticketId:guid}/attachments")]
    public async Task<IActionResult> AddAttachment(Guid ticketId, IFormFileCollection files, CancellationToken ct)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();

        var ticket = await _db.Tickets.FirstOrDefaultAsync(t => t.Id == ticketId && t.TenantId == tenantId.Value, ct);
        if (ticket == null) return NotFound(new { message = "Bilet tapılmadı" });

        const int maxFileSize = 5 * 1024 * 1024; // 5MB
        const int maxFiles = 3;

        if (files == null || files.Count == 0)
            return BadRequest(new { message = "Fayl seçin" });
        if (files.Count > maxFiles)
            return BadRequest(new { message = $"Maksimum {maxFiles} fayl əlavə edə bilərsiniz" });

        foreach (var f in files)
        {
            if (f.Length == 0 || f.Length > maxFileSize)
                return BadRequest(new { message = "Hər fayl 5MB-dan kiçik olmalıdır" });

            var ext = Path.GetExtension(f.FileName ?? "");
            if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
                return BadRequest(new { message = $"Fayl tipi icazə verilmir. İcazəli: {string.Join(", ", AllowedExtensions)}" });

            using var ms = new MemoryStream();
            await f.CopyToAsync(ms, ct);
            var content = ms.ToArray();

            var safeName = SanitizeFileName(f.FileName);

            _db.TicketAttachments.Add(new TicketAttachment
            {
                Id = Guid.NewGuid(),
                TicketId = ticketId,
                FileName = safeName,
                ContentType = f.ContentType ?? "application/octet-stream",
                Content = content,
                CreatedAt = DateTime.UtcNow,
            });
        }
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Fayl(lar) əlavə edildi" });
    }

    [HttpGet("tickets/{ticketId:guid}/attachments")]
    public async Task<IActionResult> ListAttachments(Guid ticketId, CancellationToken ct)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();

        var exists = await _db.Tickets.AnyAsync(t => t.Id == ticketId && t.TenantId == tenantId.Value, ct);
        if (!exists) return NotFound();

        var list = await _db.TicketAttachments
            .Where(a => a.TicketId == ticketId)
            .Select(a => new { a.Id, a.FileName, a.ContentType, a.CreatedAt })
            .ToListAsync(ct);
        return Ok(list);
    }

    [HttpGet("attachments/{id:guid}")]
    public async Task<IActionResult> DownloadAttachment(Guid id, CancellationToken ct)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();

        var att = await _db.TicketAttachments
            .Include(a => a.Ticket)
            .FirstOrDefaultAsync(a => a.Id == id && a.Ticket.TenantId == tenantId.Value, ct);
        if (att == null) return NotFound();

        return File(att.Content, att.ContentType, att.FileName);
    }

    private Guid? GetTenantId()
    {
        var v = User.FindFirst("tenant_id")?.Value;
        return Guid.TryParse(v, out var id) ? id : null;
    }

    private Guid? GetUserId()
    {
        var v = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(v, out var id) ? id : null;
    }
}

public record CreateTicketRequest(string Subject, string Body);
