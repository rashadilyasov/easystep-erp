using System.Net;
using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using EasyStep.Erp.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IEmailService _email;
    private readonly IConfiguration _config;

    public ContactController(ApplicationDbContext db, IEmailService email, IConfiguration config)
    {
        _db = db;
        _email = email;
        _config = config;
    }

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] ContactRequest req, CancellationToken ct)
    {
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
            var html = $@"
<!DOCTYPE html>
<html><body style='font-family:Arial,sans-serif'>
<h2>Yeni əlaqə mesajı</h2>
<p><strong>Ad:</strong> {WebUtility.HtmlEncode(req.Name)}</p>
<p><strong>E-poçt:</strong> {WebUtility.HtmlEncode(req.Email)}</p>
<p><strong>Mesaj:</strong></p>
<p>{WebUtility.HtmlEncode(req.Message).Replace("\n", "<br/>")}</p>
<p>— Easy Step ERP Portal</p>
</body></html>";
            await _email.SendAsync(adminEmail, "Easy Step ERP - Yeni əlaqə mesajı", html, ct);
        }

        return Ok(new { message = "Mesajınız uğurla qəbul edildi. Tezliklə əlaqə saxlayacağıq." });
    }
}

public record ContactRequest(string Name, string Email, string Message);
