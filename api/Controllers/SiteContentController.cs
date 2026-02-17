using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace EasyStep.Erp.Api.Controllers;

/// <summary>
/// Public API - no auth. Used by marketing pages to fetch site content.
/// </summary>
[ApiController]
[Route("api/content")]
public class SiteContentPublicController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public SiteContentPublicController(ApplicationDbContext db) => _db = db;

    [HttpGet("site")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
    {
        var items = await _db.SiteContents
            .Select(c => new { c.Key, c.Value })
            .ToListAsync(ct);
        var dict = items.ToDictionary(c => c.Key, c => JsonSerializer.Deserialize<JsonElement>(c.Value));
        return Ok(dict);
    }
}

/// <summary>
/// Admin API - CMS for editing site content.
/// </summary>
[ApiController]
[Route("api/admin/site-content")]
[Authorize(Policy = "AdminOnly")]
public class SiteContentAdminController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private static readonly JsonSerializerOptions JsonOpts = new() { WriteIndented = false };

    public SiteContentAdminController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct = default)
    {
        var items = await _db.SiteContents
            .OrderBy(c => c.Key)
            .Select(c => new { c.Key, c.Value, c.UpdatedAt })
            .ToListAsync(ct);
        return Ok(items.Select(c => new
        {
            c.Key,
            c.Value,
            updatedAt = c.UpdatedAt.ToString("yyyy-MM-dd HH:mm"),
        }));
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> Upsert(string key, [FromBody] JsonElement value, CancellationToken ct = default)
    {
        var keyNormalized = key.Trim();
        if (string.IsNullOrEmpty(keyNormalized))
            return BadRequest(new { message = "Key boş ola bilməz" });

        var valueStr = value.GetRawText();
        var existing = await _db.SiteContents.FirstOrDefaultAsync(c => c.Key == keyNormalized, ct);
        var now = DateTime.UtcNow;

        if (existing != null)
        {
            existing.Value = valueStr;
            existing.UpdatedAt = now;
        }
        else
        {
            _db.SiteContents.Add(new SiteContent
            {
                Id = Guid.NewGuid(),
                Key = keyNormalized,
                Value = valueStr,
                UpdatedAt = now,
            });
        }

        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Yadda saxlanıldı" });
    }
}
