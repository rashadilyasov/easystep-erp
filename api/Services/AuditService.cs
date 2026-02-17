using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Services;

public class AuditService
{
    private readonly ApplicationDbContext _db;

    public AuditService(ApplicationDbContext db) => _db = db;

    public async Task LogAsync(
        string action,
        Guid? actorId = null,
        string? actorEmail = null,
        string? ipAddress = null,
        string? userAgent = null,
        string? metadata = null,
        CancellationToken ct = default)
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
}
