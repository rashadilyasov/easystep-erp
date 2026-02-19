using Microsoft.AspNetCore.Mvc;

namespace EasyStep.Erp.Api.Controllers;

/// <summary>
/// Minimal test — yalnız ILogger. AuthController-in dependency səbəb olub-olmadığını yoxlayır.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthTestController : ControllerBase
{
    private readonly ILogger<AuthTestController> _log;

    public AuthTestController(ILogger<AuthTestController> log) => _log = log;

    [HttpPost("ping")]
    public IActionResult Ping()
    {
        _log.LogInformation("AuthTestController.Ping hit");
        return Ok(new { ok = true, msg = "Auth route is reachable" });
    }
}
