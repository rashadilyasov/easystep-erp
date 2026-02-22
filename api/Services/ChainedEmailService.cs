using Microsoft.Extensions.DependencyInjection;

namespace EasyStep.Erp.Api.Services;

/// <summary>Resend (HTTPS) varsa Resend, yoxdursa SMTP. Railway Hobby-da SMTP bloklanır — Resend pulsuz 3000/ay.</summary>
public class ChainedEmailService : IEmailService
{
    private readonly IServiceProvider _sp;

    public ChainedEmailService(IServiceProvider sp) => _sp = sp;

    public async Task<bool> SendAsync(string to, string subject, string htmlBody, string? from = null, CancellationToken ct = default)
    {
        var resend = _sp.GetService<ResendEmailService>();
        var smtp = _sp.GetService<ConfigurableSmtpEmailService>();

        if (resend != null)
        {
            var ok = await resend.SendAsync(to, subject, htmlBody, from, ct);
            if (ok) return true;
        }

        return smtp != null && await smtp.SendAsync(to, subject, htmlBody, from, ct);
    }
}
