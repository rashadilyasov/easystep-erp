using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Services;

public class AuditService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<AuditService> _logger;

    public AuditService(ApplicationDbContext db, ILogger<AuditService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task LogAsync(
        string action,
        Guid? actorId = null,
        string? actorEmail = null,
        string? ipAddress = null,
        string? userAgent = null,
        string? metadata = null,
        CancellationToken ct = default)
    {
        try
        {
            _db.AuditLogs.Add(new AuditLog
            {
                Id = Guid.NewGuid(),
                Action = action,
                ActorId = actorId,
                ActorEmail = actorEmail,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                Metadata = metadata,
                CreatedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AuditService.LogAsync failed for action '{Action}' (non-fatal, response unaffected)", action);
        }
    }
}
