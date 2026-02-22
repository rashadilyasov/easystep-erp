using Microsoft.Extensions.Configuration;
using Resend;

namespace EasyStep.Erp.Api.Services;

/// <summary>Resend API ilə e-poçt göndərir. Railway-dan stabil işləyir. RESEND_API_KEY təyin olunanda istifadə olunur.</summary>
public class ResendEmailService : IEmailService
{
    private readonly IResend _resend;
    private readonly IConfiguration _config;
    private readonly ILogger<ResendEmailService> _log;

    public ResendEmailService(IResend resend, IConfiguration config, ILogger<ResendEmailService> log)
    {
        _resend = resend;
        _config = config;
        _log = log;
    }

    public async Task<bool> SendAsync(string to, string subject, string htmlBody, string? from = null, CancellationToken ct = default)
    {
        var fromAddr = !string.IsNullOrWhiteSpace(from)
            ? from.Trim()
            : _config["Smtp:From"] ?? _config["Smtp__From"] ?? _config["App:From"] ?? "Easy Step ERP <onboarding@resend.dev>";
        if (!fromAddr.Contains('<'))
            fromAddr = $"Easy Step ERP <{fromAddr}>";

        try
        {
            var message = new EmailMessage
            {
                From = fromAddr,
                To = [to],
                Subject = subject,
                HtmlBody = htmlBody,
            };
            await _resend.EmailSendAsync(message, ct);
            _log.LogInformation("Resend: Email sent to {To}", to);
            return true;
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Resend: Failed to send email to {To}: {Msg}", to, ex.Message);
            return false;
        }
    }
}
