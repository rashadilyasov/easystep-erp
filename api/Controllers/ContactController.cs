using System.Net;
using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using EasyStep.Erp.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IEmailService _email;
    private readonly IConfiguration _config;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ContactController> _logger;

    public ContactController(ApplicationDbContext db, IEmailService email, IConfiguration config, IServiceScopeFactory scopeFactory, ILogger<ContactController> logger)
    {
        _db = db;
        _email = email;
        _config = config;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    [HttpPost]
    [EnableRateLimiting("contact")]
    public async Task<IActionResult> Submit([FromBody] ContactRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req?.Name) || string.IsNullOrWhiteSpace(req?.Email))
            return BadRequest(new { message = "Ad və e-poçt vacibdir" });
        if ((req.Name?.Length ?? 0) > 200 || (req.Email?.Length ?? 0) > 256 || (req.Message?.Length ?? 0) > 5000)
            return BadRequest(new { message = "Mətn həddindən artıq uzundur" });

        _db.ContactMessages.Add(new ContactMessage
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            Email = req.Email,
            Message = req.Message,
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);

        var adminEmail = _config["App:AdminEmail"] ?? _config["Smtp:AdminNotify"];
        if (!string.IsNullOrEmpty(adminEmail))
        {
            var name = req.Name;
            var emailAddr = req.Email;
            var message = req.Message ?? "";
            var html = $@"
<!DOCTYPE html>
<html><body style='font-family:Arial,sans-serif'>
<h2>Yeni əlaqə mesajı</h2>
<p><strong>Ad:</strong> {WebUtility.HtmlEncode(name)}</p>
<p><strong>E-poçt:</strong> {WebUtility.HtmlEncode(emailAddr)}</p>
<p><strong>Mesaj:</strong></p>
<p>{WebUtility.HtmlEncode(message).Replace("\n", "<br/>")}</p>
<p>— Easy Step ERP Portal</p>
</body></html>";

            var scopeFactory = _scopeFactory;
            var logger = _logger;
            _ = Task.Run(async () =>
            {
                try
                {
                    await using var scope = scopeFactory.CreateAsyncScope();
                    var emailSvc = scope.ServiceProvider.GetRequiredService<IEmailService>();
                    await emailSvc.SendAsync(adminEmail, "Easy Step ERP - Yeni əlaqə mesajı", html, from: null, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Contact form admin notification failed for {Email}", emailAddr);
                }
            });
        }

        return Ok(new { message = "Mesajınız uğurla qəbul edildi. Tezliklə əlaqə saxlayacağıq." });
    }
}

public record ContactRequest(string Name, string Email, string Message);
