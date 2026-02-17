using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContentController : ControllerBase
{
    private readonly IConfiguration _config;

    public ContentController(IConfiguration config) => _config = config;

    [HttpGet("academy")]
    [Authorize]
    public IActionResult GetAcademy()
    {
        var playlistId = _config["App:AcademyYoutubePlaylistId"] ?? "";
        return Ok(new { youtubePlaylistId = playlistId });
    }
}
