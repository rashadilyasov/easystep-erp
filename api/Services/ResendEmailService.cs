using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace EasyStep.Erp.Api.Services;

/// <summary>Resend HTTPS API — Railway Hobby-da SMTP bloklananda pulsuz alternativ (3000 e-poçt/ay).</summary>
public class ResendEmailService : IEmailService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<ResendEmailService> _log;
    private readonly EmailSettingsService _emailSettings;

    public ResendEmailService(HttpClient http, IConfiguration config, ILogger<ResendEmailService> log, EmailSettingsService emailSettings)
    {
        _http = http;
        _config = config;
        _log = log;
        _emailSettings = emailSettings;
    }

    public async Task<bool> SendAsync(string to, string subject, string htmlBody, string? from = null, CancellationToken ct = default)
    {
        var apiKey = await GetApiKeyAsync(ct);
        if (string.IsNullOrWhiteSpace(apiKey))
            return false;

        var fromAddr = from?.Trim() ?? "Easy Step ERP <hello@easysteperp.com>";
        if (!fromAddr.Contains('<'))
            fromAddr = $"Easy Step ERP <{fromAddr}>";

        var payload = new
        {
            from = fromAddr,
            to = new[] { to },
            subject,
            html = htmlBody,
        };

        try
        {
            var req = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"),
            };
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            var res = await _http.SendAsync(req, ct);
            var body = await res.Content.ReadAsStringAsync(ct);

            if (res.IsSuccessStatusCode)
            {
                _log.LogInformation("Resend email sent to {To}", to);
                return true;
            }

            _log.LogWarning("Resend API error {Status}: {Body}", res.StatusCode, body.Length > 200 ? body[..200] + "…" : body);
            return false;
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Resend send failed to {To}", to);
            return false;
        }
    }

    private async Task<string?> GetApiKeyAsync(CancellationToken ct)
    {
        var fromDb = await _emailSettings.GetResendApiKeyAsync(ct);
        if (!string.IsNullOrWhiteSpace(fromDb)) return fromDb;
        return _config["Resend:ApiKey"] ?? _config["Resend__ApiKey"];
    }

}
