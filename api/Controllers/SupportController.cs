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
