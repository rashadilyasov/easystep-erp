using System.Text.Json;
using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Services;

public static class EmailTemplateKeys
{
    public const string Verification = "email:template:verification";
    public const string AffiliateVerification = "email:template:affiliateVerification";
    public const string PasswordReset = "email:template:passwordReset";
    public const string LoginOtp = "email:template:loginOtp";
    public const string TwoFaConfirm = "email:template:2faConfirm";
    public const string TwoFaDisable = "email:template:2faDisable";
    public const string AffiliateApproved = "email:template:affiliateApproved";
    public const string BonusReminder = "email:template:bonusReminder";
    public const string PaymentConfirm = "email:template:paymentConfirm";
    public const string Notification = "email:template:notification";
}

public class EmailTemplateService
{
    private readonly ApplicationDbContext _db;

    public EmailTemplateService(ApplicationDbContext db) => _db = db;

    public async Task<(string Subject, string Body)> GetTemplateAsync(string key, IReadOnlyDictionary<string, string> placeholders, CancellationToken ct = default)
    {
        var sc = await _db.SiteContents.FirstOrDefaultAsync(c => c.Key == key, ct);
        string subj, body;
        if (sc != null && !string.IsNullOrEmpty(sc.Value))
        {
            try
            {
                var j = JsonSerializer.Deserialize<JsonElement>(sc.Value);
                subj = j.TryGetProperty("subject", out var s) ? s.GetString() ?? "" : "";
                body = j.TryGetProperty("body", out var b) ? b.GetString() ?? "" : "";
            }
            catch
            {
                (subj, body) = GetDefault(key);
            }
        }
        else
            (subj, body) = GetDefault(key);

        foreach (var (k, v) in placeholders)
        {
            var placeholder = "{{" + k + "}}";
            subj = subj.Replace(placeholder, v ?? "");
            body = body.Replace(placeholder, v ?? "");
        }
        return (subj, body);
    }

    public async Task<object?> GetRawTemplateAsync(string key, CancellationToken ct = default)
    {
        var sc = await _db.SiteContents.FirstOrDefaultAsync(c => c.Key == key, ct);
        if (sc == null || string.IsNullOrEmpty(sc.Value)) return GetDefaultForAdmin(key);
        try
        {
            return JsonSerializer.Deserialize<object>(sc.Value);
        }
        catch { return GetDefaultForAdmin(key); }
    }

    public async Task SaveTemplateAsync(string key, string subject, string body, CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(new { subject, body });
        var sc = await _db.SiteContents.FirstOrDefaultAsync(c => c.Key == key, ct);
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
                Key = key,
                Value = json,
                UpdatedAt = DateTime.UtcNow,
            });
        }
        await _db.SaveChangesAsync(ct);
    }

    private static (string Subject, string Body) GetDefault(string key) => key switch
    {
        EmailTemplateKeys.Verification => ("Easy Step ERP - E-poçt təsdiqi",
            "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif'><h2>E-poçtunuzu təsdiqləyin</h2><p>Salam,</p><p>Easy Step ERP hesabınızı aktivləşdirmək üçün aşağıdakı linkə keçid edin:</p><p><a href='{{verifyUrl}}'>{{verifyUrl}}</a></p><p>Link 24 saat ərzində keçərlidir.</p><p>— Easy Step ERP</p></body></html>"),
        EmailTemplateKeys.AffiliateVerification => ("Easy Step ERP - Satış partnyoru e-poçt təsdiqi",
            "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif'><h2>E-poçtunuzu təsdiqləyin</h2><p>Salam,</p><p>Easy Step ERP satış partnyoru hesabınızı aktivləşdirmək üçün aşağıdakı linkə keçid edin:</p><p><a href='{{verifyUrl}}'>{{verifyUrl}}</a></p><p>Link 24 saat ərzində keçərlidir.</p><p>— Easy Step ERP</p></body></html>"),
        EmailTemplateKeys.PasswordReset => ("Easy Step ERP - Şifrə sıfırlama",
            "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif'><h2>Şifrə sıfırlama</h2><p>Şifrənizi sıfırlamaq üçün aşağıdakı linkə keçid edin:</p><p><a href='{{resetUrl}}'>{{resetUrl}}</a></p><p>Link 1 saat ərzində keçərlidir.</p><p>Əgər bu tələb sizdən gəlməyibsə, bu e-poçtu nəzərə almayın.</p><p>— Easy Step ERP</p></body></html>"),
        EmailTemplateKeys.LoginOtp => ("Easy Step ERP - Daxil olma kodu",
            "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif'><h2>Daxil olma kodu</h2><p>Salam,</p><p>Easy Step ERP daxil olma kodunuz: <strong>{{code}}</strong></p><p>Kod 10 dəqiqə ərzində keçərlidir.</p><p>Əgər bu tələb sizdən gəlməyibsə, bu e-poçtu nəzərə almayın.</p><p>— Easy Step ERP</p></body></html>"),
        EmailTemplateKeys.TwoFaConfirm => ("Easy Step ERP - 2FA təsdiq kodu",
            "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif'><h2>2FA təsdiq kodu</h2><p>Salam,</p><p>2FA aktivləşdirmək üçün kodunuz: <strong>{{code}}</strong></p><p>— Easy Step ERP</p></body></html>"),
        EmailTemplateKeys.TwoFaDisable => ("Easy Step ERP - 2FA söndürmə kodu",
            "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif'><h2>2FA söndürmə kodu</h2><p>Salam,</p><p>2FA söndürmək üçün kodunuz: <strong>{{code}}</strong></p><p>— Easy Step ERP</p></body></html>"),
        EmailTemplateKeys.AffiliateApproved => ("Easy Step ERP - Partnyor təsdiqi",
            "<p>Salam.</p><p>Satış partnyoru qeydiyyatınız təsdiqləndi. İndi promo kodlar yarada və panelə daxil ola bilərsiniz: <a href='{{affiliatePanelUrl}}'>{{affiliatePanelUrl}}</a></p>"),
        EmailTemplateKeys.BonusReminder => ("Easy Step ERP - Bonus xəbərdarlığı ({{year}}-{{month}})",
            "<p>Salam.</p><p>Keçən ay ({{year}}-{{month}}) {{customerCount}} müştəri ilə ödəniş aldınız. Bonus üçün minimum 5 müştəri tələb olunur. Bu ay daha çox müştəri cəlb etməyə çalışın.</p>"),
        EmailTemplateKeys.PaymentConfirm => ("Easy Step ERP - Ödəniş təsdiqi",
            "<p>Salam {{tenantName}},</p><p>Ödənişiniz qəbul olundu. Məbləğ: {{amount}} {{currency}}</p><p>Plan: {{planName}}</p><p>— Easy Step ERP</p>"),
        EmailTemplateKeys.Notification => ("Easy Step ERP - Bildiriş",
            "<p>Salam,</p><p>{{message}}</p><p>— Easy Step ERP</p>"),
        _ => ("", ""),
    };

    private static object GetDefaultForAdmin(string key)
    {
        var (subject, body) = GetDefault(key);
        return new { subject, body };
    }
}
