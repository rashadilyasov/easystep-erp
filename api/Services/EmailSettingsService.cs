using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace EasyStep.Erp.Api.Services;

public class SmtpConfig
{
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public string User { get; set; } = "";
    public string? Password { get; set; }
    public string From { get; set; } = "hello@easysteperp.com";
    public bool UseSsl { get; set; } = true;
    /// <summary>Şablonlarda combobox üçün göndərən ünvanları siyahısı. Baş "From" həm də siyahıya daxildir.</summary>
    public List<string>? FromAddresses { get; set; }
}

public class EmailSettingsService
{
    private readonly ApplicationDbContext _db;
    private const string SmtpKey = "email:smtp";
    private const string ResendKey = "email:resend";

    public EmailSettingsService(ApplicationDbContext db) => _db = db;

    private static bool HasResendInConfig(IConfiguration? config)
    {
        if (config == null) return false;
        var k = config["Resend:ApiKey"] ?? config["Resend__ApiKey"];
        return !string.IsNullOrWhiteSpace(k);
    }

    public async Task<SmtpConfig?> GetSmtpFromDbAsync(CancellationToken ct = default)
    {
        var sc = await _db.SiteContents.FirstOrDefaultAsync(c => c.Key == SmtpKey, ct);
        if (sc == null || string.IsNullOrEmpty(sc.Value)) return null;
        try
        {
            var j = System.Text.Json.JsonSerializer.Deserialize<SmtpConfig>(sc.Value);
            return j;
        }
        catch { return null; }
    }

    private static readonly string[] DefaultFromAddresses = ["hello@easysteperp.com", "noreply@easysteperp.com", "security@easysteperp.com", "partners@easysteperp.com", "billing@easysteperp.com", "notifications@easysteperp.com"];

    /// <summary>Admin üçün — parol qaytarılmır (boş); saxlanarkən boş buraxılsa köhnə parol saxlanır.</summary>
    public async Task<object> GetSmtpForAdminAsync(IConfiguration? config = null, CancellationToken ct = default)
    {
        return await GetEmailSettingsForAdminAsync(config, ct);
    }

    public async Task<object> GetEmailSettingsForAdminAsync(IConfiguration? config, CancellationToken ct = default)
    {
        var c = await GetSmtpFromDbAsync(ct);
        var addrs = c?.FromAddresses?.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x!.Trim()).Distinct().ToList() ?? new List<string>();
        if (addrs.Count == 0) addrs = [c?.From ?? "hello@easysteperp.com", .. DefaultFromAddresses.Where(a => a != (c?.From ?? ""))];
        addrs = addrs.Distinct().ToList();
        var resendKey = await GetResendApiKeyAsync(ct);
        var hasResend = !string.IsNullOrWhiteSpace(resendKey) || HasResendInConfig(config);
        return new
        {
            host = c?.Host ?? "",
            port = c?.Port ?? 587,
            user = c?.User ?? "",
            password = "",
            from = c?.From ?? "hello@easysteperp.com",
            useSsl = c?.UseSsl ?? true,
            fromAddresses = addrs,
            resendConfigured = hasResend,
            resendApiKey = hasResend ? "********" : "",
        };
    }

    public async Task SaveSmtpAsync(SmtpConfig config, string? newPasswordIfProvided, CancellationToken ct = default)
    {
        if (!string.IsNullOrEmpty(newPasswordIfProvided) && newPasswordIfProvided != "********")
            config.Password = newPasswordIfProvided;
        else
        {
            var existing = await GetSmtpFromDbAsync(ct);
            if (existing?.Password != null) config.Password = existing.Password;
        }

        var json = System.Text.Json.JsonSerializer.Serialize(config);
        var sc = await _db.SiteContents.FirstOrDefaultAsync(c => c.Key == SmtpKey, ct);
        if (sc != null)
        {
            sc.Value = json;
            sc.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.SiteContents.Add(new SiteContent
            {
                Id = Guid.NewGuid(),
                Key = SmtpKey,
                Value = json,
                UpdatedAt = DateTime.UtcNow,
            });
        }
        await _db.SaveChangesAsync(ct);
    }

    public async Task<string?> GetResendApiKeyAsync(CancellationToken ct = default)
    {
        var sc = await _db.SiteContents.FirstOrDefaultAsync(c => c.Key == ResendKey, ct);
        return sc?.Value?.Trim();
    }

    public async Task SaveResendApiKeyAsync(string? apiKey, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(apiKey) || apiKey == "********")
        {
            var existing = await _db.SiteContents.FirstOrDefaultAsync(c => c.Key == ResendKey, ct);
            if (existing != null) _db.SiteContents.Remove(existing);
        }
        else
        {
            var sc = await _db.SiteContents.FirstOrDefaultAsync(c => c.Key == ResendKey, ct);
            if (sc != null)
            {
                sc.Value = apiKey.Trim();
                sc.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _db.SiteContents.Add(new SiteContent
                {
                    Id = Guid.NewGuid(),
                    Key = ResendKey,
                    Value = apiKey.Trim(),
                    UpdatedAt = DateTime.UtcNow,
                });
            }
        }
        await _db.SaveChangesAsync(ct);
    }
}
