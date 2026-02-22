using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace EasyStep.Erp.Api.Services;

/// <summary>SMTP ayarlarını əvvəlcə DB-dən (Admin paneldən), sonra appsettings-dən oxuyur.</summary>
public class ConfigurableSmtpEmailService : IEmailService
{
    private readonly EmailSettingsService _emailSettings;
    private readonly IConfiguration _config;
    private readonly ILogger<ConfigurableSmtpEmailService> _log;

    public ConfigurableSmtpEmailService(EmailSettingsService emailSettings, IConfiguration config, ILogger<ConfigurableSmtpEmailService> log)
    {
        _emailSettings = emailSettings;
        _config = config;
        _log = log;
    }

    public async Task<bool> SendAsync(string to, string subject, string htmlBody, string? from = null, CancellationToken ct = default)
    {
        SmtpConfig? smtp = await _emailSettings.GetSmtpFromDbAsync(ct);
        if (smtp == null || string.IsNullOrEmpty(smtp.Host))
        {
            smtp = FromConfig();
        }

        if (smtp == null || string.IsNullOrEmpty(smtp.Host) || string.IsNullOrEmpty(smtp.User))
        {
            _log.LogWarning("SMTP not configured (Host/User required). Email to {To} NOT sent.", to);
            return false;
        }
        if (string.IsNullOrEmpty(smtp.Password))
        {
            _log.LogWarning("SMTP Password is empty (Admin paneldə parol daxil edib saxlayın). Email to {To} NOT sent. Host={Host}", to, smtp.Host);
            return false;
        }

        var fromAddr = !string.IsNullOrWhiteSpace(from) ? from.Trim() : smtp.From;
        if (string.IsNullOrEmpty(fromAddr)) fromAddr = "hello@easysteperp.com";

        try
        {
            using var client = new SmtpClient(smtp.Host, smtp.Port)
            {
                EnableSsl = smtp.Port == 465 || smtp.UseSsl,
                Credentials = new NetworkCredential(smtp.User, smtp.Password ?? ""),
                Timeout = 15000,
            };
            var msg = new MailMessage
            {
                From = new MailAddress(fromAddr, "Easy Step ERP"),
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
            var inner = ex.InnerException?.Message ?? "";
            var full = ex.ToString();
            _log.LogError(ex, "Failed to send email to {To}. Message: {Msg} Inner: {Inner}. Trace: {Trace}", to, ex.Message, inner, full.Length > 500 ? full[..500] + "…" : full);
            return false;
        }
    }

    private SmtpConfig? FromConfig()
    {
        var host = _config["Smtp:Host"];
        if (string.IsNullOrEmpty(host)) return null;
        var port = int.Parse(_config["Smtp:Port"] ?? "587");
        return new SmtpConfig
        {
            Host = host,
            Port = port,
            User = _config["Smtp:User"] ?? "",
            Password = _config["Smtp:Password"],
            From = _config["Smtp:From"] ?? "hello@easysteperp.com",
            UseSsl = port == 465 || bool.Parse(_config["Smtp:UseSsl"] ?? "true"),
        };
    }
}
