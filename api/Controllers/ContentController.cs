using System.Text.Json;
using EasyStep.Erp.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContentController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly ApplicationDbContext _db;

    public ContentController(IConfiguration config, ApplicationDbContext db)
    {
        _config = config;
        _db = db;
    }

    [HttpGet("academy")]
    [Authorize]
    public IActionResult GetAcademy()
    {
        var playlistId = _config["App:AcademyYoutubePlaylistId"] ?? "";
        return Ok(new { youtubePlaylistId = playlistId });
    }

    [HttpGet("academy-materials")]
    [Authorize]
    public async Task<IActionResult> GetAcademyMaterials(CancellationToken ct)
    {
        var sc = await _db.SiteContents.FirstOrDefaultAsync(c => c.Key == "content:academyMaterials", ct);
        if (sc == null || string.IsNullOrEmpty(sc.Value))
            return Ok(Array.Empty<object>());
        try
        {
            var arr = JsonSerializer.Deserialize<List<AcademyMaterialDto>>(sc.Value);
            return Ok(arr ?? new List<AcademyMaterialDto>());
        }
        catch { return Ok(Array.Empty<object>()); }
    }

    [HttpGet("announcements")]
    [Authorize]
    public async Task<IActionResult> GetAnnouncements(CancellationToken ct)
    {
        var sc = await _db.SiteContents.FirstOrDefaultAsync(c => c.Key == "content:announcements", ct);
        if (sc == null || string.IsNullOrEmpty(sc.Value))
            return Ok(Array.Empty<object>());
        try
        {
            var arr = JsonSerializer.Deserialize<List<AnnouncementDto>>(sc.Value);
            return Ok((arr ?? new List<AnnouncementDto>()).Where(a => a.active).OrderByDescending(a => a.publishedAt).Take(10));
        }
        catch { return Ok(Array.Empty<object>()); }
    }
}

public record AnnouncementDto(string id, string title, string body, string publishedAt, bool active);
public record AcademyMaterialDto(string title, string url);
