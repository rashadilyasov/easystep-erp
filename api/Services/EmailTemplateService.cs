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
    public const string UserInvite = "email:template:userInvite";
}

public class EmailTemplateService
{
    private readonly ApplicationDbContext _db;

    public EmailTemplateService(ApplicationDbContext db) => _db = db;

    public async Task<(string Subject, string Body, string? From)> GetTemplateAsync(string key, IReadOnlyDictionary<string, string> placeholders, CancellationToken ct = default)
    {
        var sc = await _db.SiteContents.FirstOrDefaultAsync(c => c.Key == key, ct);
        string subj, body;
        string? from = null;
        if (sc != null && !string.IsNullOrEmpty(sc.Value))
        {
            try
            {
                var j = JsonSerializer.Deserialize<JsonElement>(sc.Value);
                subj = j.TryGetProperty("subject", out var s) ? s.GetString() ?? "" : "";
                body = j.TryGetProperty("body", out var b) ? b.GetString() ?? "" : "";
                from = j.TryGetProperty("from", out var f) ? f.GetString() : null;
            }
            catch
            {
                var d = GetDefault(key);
                (subj, body, from) = (d.Subject, d.Body, d.From);
            }
        }
        else
        {
            var d = GetDefault(key);
            (subj, body, from) = (d.Subject, d.Body, d.From);
        }

        foreach (var (k, v) in placeholders)
        {
            var placeholder = "{{" + k + "}}";
            subj = subj.Replace(placeholder, v ?? "");
            body = body.Replace(placeholder, v ?? "");
        }
        return (subj, body, string.IsNullOrWhiteSpace(from) ? null : from.Trim());
    }

    public async Task<object?> GetRawTemplateAsync(string key, CancellationToken ct = default)
    {
        var (defaultSubj, defaultBody, defaultFrom) = GetDefault(key);
        var sc = await _db.SiteContents.FirstOrDefaultAsync(c => c.Key == key, ct);
        if (sc == null || string.IsNullOrEmpty(sc.Value)) return new { subject = defaultSubj, body = defaultBody, from = defaultFrom };
        try
        {
            var j = JsonSerializer.Deserialize<JsonElement>(sc.Value);
            var subj = (j.TryGetProperty("subject", out var s) ? s.GetString() ?? "" : "").Trim();
            var body = (j.TryGetProperty("body", out var b) ? b.GetString() ?? "" : "").Trim();
            var from = j.TryGetProperty("from", out var f) ? f.GetString() : null;
            if (string.IsNullOrEmpty(subj)) subj = defaultSubj;
            if (string.IsNullOrEmpty(body)) body = defaultBody;
            return new { subject = subj, body = body, from = string.IsNullOrWhiteSpace(from) ? defaultFrom : from };
        }
        catch { return new { subject = defaultSubj, body = defaultBody, from = defaultFrom }; }
    }

    /// <summary>Hələ mövcud olmayan şablonlar üçün default Mövzu və mətn əlavə edir (Admin panelində dolu görünməsi üçün).</summary>
    public async Task EnsureDefaultTemplatesAsync(CancellationToken ct = default)
    {
        var keys = new[]
        {
            EmailTemplateKeys.Verification, EmailTemplateKeys.AffiliateVerification, EmailTemplateKeys.PasswordReset,
            EmailTemplateKeys.LoginOtp, EmailTemplateKeys.TwoFaConfirm, EmailTemplateKeys.TwoFaDisable,
            EmailTemplateKeys.AffiliateApproved, EmailTemplateKeys.BonusReminder, EmailTemplateKeys.PaymentConfirm,
            EmailTemplateKeys.Notification, EmailTemplateKeys.UserInvite,
        };
        foreach (var key in keys)
        {
            if (await _db.SiteContents.AnyAsync(c => c.Key == key, ct)) continue;
            var (subject, body, from) = GetDefault(key);
            if (string.IsNullOrEmpty(subject)) continue;
            var fromVal = string.IsNullOrWhiteSpace(from) ? null : from.Trim();
            var json = JsonSerializer.Serialize(new { subject, body, from = fromVal });
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

    public async Task SaveTemplateAsync(string key, string subject, string body, string? from = null, CancellationToken ct = default)
    {
        var fromVal = string.IsNullOrWhiteSpace(from) ? null : from.Trim();
        var json = JsonSerializer.Serialize(new { subject, body, from = fromVal });
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

    private static (string Subject, string Body, string? From) GetDefault(string key) => key switch
    {
        EmailTemplateKeys.Verification => ("Easy Step ERP - E-poçt təsdiqi",
            "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/></head><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333\"><div style=\"max-width:600px;margin:0 auto;padding:20px\"><h2 style=\"color:#1e40af\">E-poçtunuzu təsdiqləyin</h2><p>Salam {{userName}},</p><p>Easy Step ERP hesabınızı aktivləşdirmək üçün aşağıdakı linkə keçid edin:</p><p><a href=\"{{verifyUrl}}\" style=\"display:inline-block;padding:12px 24px;background:#1e40af;color:white;text-decoration:none;border-radius:6px\">E-poçtu təsdiqlə</a></p><p style=\"color:#666;font-size:14px\">Link 24 saat ərzində keçərlidir. Əgər hesab yaratmaq istəməmisinizsə, bu e-poçtu nəzərə almayın.</p><hr style=\"border:none;border-top:1px solid #eee;margin:24px 0\"/><p style=\"color:#888;font-size:12px\">— Easy Step ERP</p></div></body></html>", "noreply@easysteperp.com"),
        EmailTemplateKeys.AffiliateVerification => ("Easy Step ERP - Satış partnyoru e-poçt təsdiqi",
            "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/></head><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333\"><div style=\"max-width:600px;margin:0 auto;padding:20px\"><h2 style=\"color:#1e40af\">E-poçtunuzu təsdiqləyin</h2><p>Salam {{userName}},</p><p>Easy Step ERP satış partnyoru hesabınızı aktivləşdirmək üçün aşağıdakı linkə keçid edin:</p><p><a href=\"{{verifyUrl}}\" style=\"display:inline-block;padding:12px 24px;background:#1e40af;color:white;text-decoration:none;border-radius:6px\">E-poçtu təsdiqlə</a></p><p style=\"color:#666;font-size:14px\">Link 24 saat ərzində keçərlidir. Təsdiqdən sonra admin panelə daxil olub promo kodlar yarada biləcəksiniz.</p><hr style=\"border:none;border-top:1px solid #eee;margin:24px 0\"/><p style=\"color:#888;font-size:12px\">— Easy Step ERP</p></div></body></html>", "noreply@easysteperp.com"),
        EmailTemplateKeys.PasswordReset => ("Easy Step ERP - Şifrə sıfırlama",
            "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/></head><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333\"><div style=\"max-width:600px;margin:0 auto;padding:20px\"><h2 style=\"color:#1e40af\">Şifrə sıfırlama</h2><p>Salam {{userName}},</p><p>Şifrənizi sıfırlamaq üçün aşağıdakı linkə keçid edin:</p><p><a href=\"{{resetUrl}}\" style=\"display:inline-block;padding:12px 24px;background:#1e40af;color:white;text-decoration:none;border-radius:6px\">Şifrəni sıfırla</a></p><p style=\"color:#666;font-size:14px\">Link 1 saat ərzində keçərlidir.</p><p style=\"color:#dc2626;font-size:14px\">Əgər bu tələb sizdən gəlməyibsə, bu e-poçtu nəzərə almayın və şifrənizi dəyişməyin.</p><hr style=\"border:none;border-top:1px solid #eee;margin:24px 0\"/><p style=\"color:#888;font-size:12px\">— Easy Step ERP</p></div></body></html>", "security@easysteperp.com"),
        EmailTemplateKeys.LoginOtp => ("Easy Step ERP - Daxil olma kodu",
            "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/></head><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333\"><div style=\"max-width:600px;margin:0 auto;padding:20px\"><h2 style=\"color:#1e40af\">Daxil olma kodu</h2><p>Salam {{userName}},</p><p>Easy Step ERP sisteminə daxil olmaq üçün kodunuz:</p><p style=\"font-size:24px;font-weight:bold;letter-spacing:4px;background:#f3f4f6;padding:16px;border-radius:8px;text-align:center\">{{code}}</p><p style=\"color:#666;font-size:14px\">Kod 10 dəqiqə ərzində keçərlidir.</p><p style=\"color:#dc2626;font-size:14px\">Əgər bu tələb sizdən gəlməyibsə, bu e-poçtu nəzərə almayın.</p><hr style=\"border:none;border-top:1px solid #eee;margin:24px 0\"/><p style=\"color:#888;font-size:12px\">— Easy Step ERP</p></div></body></html>", "security@easysteperp.com"),
        EmailTemplateKeys.TwoFaConfirm => ("Easy Step ERP - 2FA təsdiq kodu",
            "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/></head><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333\"><div style=\"max-width:600px;margin:0 auto;padding:20px\"><h2 style=\"color:#1e40af\">2FA təsdiq kodu</h2><p>Salam {{userName}},</p><p>İki faktorlu identifikasiya (2FA) aktivləşdirmək üçün təsdiq kodunuz:</p><p style=\"font-size:24px;font-weight:bold;letter-spacing:4px;background:#f3f4f6;padding:16px;border-radius:8px;text-align:center\">{{code}}</p><p style=\"color:#666;font-size:14px\">Bu kodu təsdiq ekranına daxil edin. Əgər siz bu əməliyyatı başlatmayıbsınızsa, bu e-poçtu nəzərə almayın.</p><hr style=\"border:none;border-top:1px solid #eee;margin:24px 0\"/><p style=\"color:#888;font-size:12px\">— Easy Step ERP</p></div></body></html>", "security@easysteperp.com"),
        EmailTemplateKeys.TwoFaDisable => ("Easy Step ERP - 2FA söndürmə kodu",
            "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/></head><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333\"><div style=\"max-width:600px;margin:0 auto;padding:20px\"><h2 style=\"color:#1e40af\">2FA söndürmə kodu</h2><p>Salam {{userName}},</p><p>İki faktorlu identifikasiya (2FA) söndürmək üçün təsdiq kodunuz:</p><p style=\"font-size:24px;font-weight:bold;letter-spacing:4px;background:#f3f4f6;padding:16px;border-radius:8px;text-align:center\">{{code}}</p><p style=\"color:#666;font-size:14px\">Bu kodu söndürmə ekranına daxil edin. Əgər siz bu əməliyyatı başlatmayıbsınızsa, bu e-poçtu nəzərə almayın.</p><hr style=\"border:none;border-top:1px solid #eee;margin:24px 0\"/><p style=\"color:#888;font-size:12px\">— Easy Step ERP</p></div></body></html>", "security@easysteperp.com"),
        EmailTemplateKeys.AffiliateApproved => ("Easy Step ERP - Partnyor təsdiqi",
            "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/></head><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333\"><div style=\"max-width:600px;margin:0 auto;padding:20px\"><h2 style=\"color:#16a34a\">Qeydiyyatınız təsdiqləndi</h2><p>Salam {{userName}},</p><p>Satış partnyoru qeydiyyatınız təsdiqləndi. İndi promo kodlar yarada və partnyor paneline daxil ola bilərsiniz:</p><p><a href=\"{{affiliatePanelUrl}}\" style=\"display:inline-block;padding:12px 24px;background:#16a34a;color:white;text-decoration:none;border-radius:6px\">Partnyor paneline keç</a></p><p style=\"color:#666;font-size:14px\">Promo kodlarınızla müştərilərə endirim təklif edə və hər uğurlu ödənişdə komissiya əldə edə bilərsiniz.</p><hr style=\"border:none;border-top:1px solid #eee;margin:24px 0\"/><p style=\"color:#888;font-size:12px\">— Easy Step ERP</p></div></body></html>", "partners@easysteperp.com"),
        EmailTemplateKeys.BonusReminder => ("Easy Step ERP - Bonus xəbərdarlığı ({{year}}-{{month}})",
            "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/></head><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333\"><div style=\"max-width:600px;margin:0 auto;padding:20px\"><h2 style=\"color:#1e40af\">Bonus xəbərdarlığı</h2><p>Salam {{userName}},</p><p>Keçən ay ({{year}}-{{month}}) {{customerCount}} müştəri ilə ödəniş aldınız.</p><p style=\"color:#666;font-size:14px\">Bonus üçün minimum <strong>5 müştəri</strong> tələb olunur. Bu ay daha çox müştəri cəlb etməyə çalışın — hədəfinizə çatanda bonus avtomatik hesablanacaq.</p><hr style=\"border:none;border-top:1px solid #eee;margin:24px 0\"/><p style=\"color:#888;font-size:12px\">— Easy Step ERP</p></div></body></html>", "partners@easysteperp.com"),
        EmailTemplateKeys.PaymentConfirm => ("Easy Step ERP - Ödəniş təsdiqi",
            "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/></head><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333\"><div style=\"max-width:600px;margin:0 auto;padding:20px\"><h2 style=\"color:#16a34a\">Ödənişiniz qəbul olundu</h2><p>Salam {{userName}},</p><p>Ödənişiniz uğurla tamamlandı.</p><table style=\"width:100%;border-collapse:collapse;margin:16px 0\"><tr style=\"background:#f9fafb\"><td style=\"padding:12px;border:1px solid #eee\">Plan</td><td style=\"padding:12px;border:1px solid #eee\">{{planName}}</td></tr><tr><td style=\"padding:12px;border:1px solid #eee\">Məbləğ</td><td style=\"padding:12px;border:1px solid #eee\"><strong>{{amount}} {{currency}}</strong></td></tr></table><p style=\"color:#666;font-size:14px\">Çek və faktura ödəniş tarixçənizdən əldə edilə bilər.</p><hr style=\"border:none;border-top:1px solid #eee;margin:24px 0\"/><p style=\"color:#888;font-size:12px\">— Easy Step ERP</p></div></body></html>", "billing@easysteperp.com"),
        EmailTemplateKeys.Notification => ("Easy Step ERP - Bildiriş",
            "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/></head><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333\"><div style=\"max-width:600px;margin:0 auto;padding:20px\"><h2 style=\"color:#1e40af\">Bildiriş</h2><p>Salam {{userName}},</p><div style=\"background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0\">{{message}}</div><hr style=\"border:none;border-top:1px solid #eee;margin:24px 0\"/><p style=\"color:#888;font-size:12px\">— Easy Step ERP</p></div></body></html>", "notifications@easysteperp.com"),
        EmailTemplateKeys.UserInvite => ("Easy Step ERP - Şirkətə dəvət",
            "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/></head><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333\"><div style=\"max-width:600px;margin:0 auto;padding:20px\"><h2 style=\"color:#1e40af\">Şirkətə dəvət</h2><p>Salam,</p><p>{{inviterName}} sizi <strong>{{tenantName}}</strong> şirkətinə Easy Step ERP istifadəçisi kimi dəvət edir.</p><p>Qeydiyyatı tamamlamaq üçün aşağıdakı linkə keçid edin və şifrənizi təyin edin:</p><p><a href=\"{{inviteUrl}}\" style=\"display:inline-block;padding:12px 24px;background:#1e40af;color:white;text-decoration:none;border-radius:6px\">Qeydiyyatı tamamla</a></p><p style=\"color:#666;font-size:14px\">Link 7 gün ərzində keçərlidir.</p><hr style=\"border:none;border-top:1px solid #eee;margin:24px 0\"/><p style=\"color:#888;font-size:12px\">— Easy Step ERP</p></div></body></html>", "noreply@easysteperp.com"),
        _ => ("", "", null),
    };

    private static object GetDefaultForAdmin(string key)
    {
        var (subject, body, from) = GetDefault(key);
        return new { subject, body, from };
    }
}
