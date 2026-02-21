using System.Net;
using System.Net.Mail;

namespace EasyStep.Erp.Api.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _log;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> log)
    {
        _config = config;
        _log = log;
    }

    public async Task<bool> SendAsync(string to, string subject, string htmlBody, string? fromOverride = null, CancellationToken ct = default)
    {
        var host = _config["Smtp:Host"];
        var port = int.Parse(_config["Smtp:Port"] ?? "587");
        var user = _config["Smtp:User"];
        var pass = _config["Smtp:Password"];
        var from = !string.IsNullOrWhiteSpace(fromOverride) ? fromOverride.Trim() : (_config["Smtp:From"] ?? "hello@easysteperp.com");

        if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(user))
        {
            _log.LogWarning("SMTP not configured. Skipping email to {To}", to);
            return true; // Don't fail the request
        }

        try
        {
            using var client = new SmtpClient(host, port)
            {
                EnableSsl = port == 465 || bool.Parse(_config["Smtp:UseSsl"] ?? "true"),
                Credentials = new NetworkCredential(user, pass),
            };
            var msg = new MailMessage
            {
                From = new MailAddress(from, "Easy Step ERP"),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true,
            };
            msg.To.Add(to);
            await client.SendMailAsync(msg, ct);
            _log.LogInformation("Email sent to {To}", to);
            return true;
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Failed to send email to {To}", to);
            return false;
        }
    }
}
