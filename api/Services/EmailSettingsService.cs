using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Services;

public class SmtpConfig
{
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public string User { get; set; } = "";
    public string? Password { get; set; }
    public string From { get; set; } = "hello@easysteperp.com";
    public bool UseSsl { get; set; } = true;
}

public class EmailSettingsService
{
    private readonly ApplicationDbContext _db;
    private const string SmtpKey = "email:smtp";

    public EmailSettingsService(ApplicationDbContext db) => _db = db;

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

    /// <summary>Admin üçün — parol maskalanır.</summary>
    public async Task<object> GetSmtpForAdminAsync(CancellationToken ct = default)
    {
        var c = await GetSmtpFromDbAsync(ct);
        if (c == null) return new { host = "", port = 587, user = "", password = "", from = "hello@easysteperp.com", useSsl = true };
        return new
        {
            c.Host,
            c.Port,
            c.User,
            password = string.IsNullOrEmpty(c.Password) ? "" : "********",
            c.From,
            c.UseSsl,
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
}
