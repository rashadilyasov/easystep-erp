using EasyStep.Erp.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly AuditService _audit;
    private readonly IEmailService _email;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AuthService auth, AuditService audit, IEmailService email, IConfiguration config, ILogger<AuthController> logger)
    {
        _auth = auth;
        _audit = audit;
        _email = email;
        _config = config;
        _logger = logger;
    }

    [HttpPost("register")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req, CancellationToken ct)
    {
        if (!req.AcceptTerms)
            return BadRequest(new { message = "Şərtləri qəbul etməlisiniz" });

        try
        {
            var (ok, token, errorCode) = await _auth.RegisterAsync(req, ct);
            if (!ok)
                return BadRequest(new { message = errorCode == "InvalidPromoCode" ? "Promo kod mövcud deyil və ya artıq istifadə olunub" : "Bu e-poçt artıq qeydiyyatdadır" });

            if (!string.IsNullOrEmpty(token))
            {
                var baseUrl = _config["App:BaseUrl"] ?? "https://www.easysteperp.com";
                var verifyUrl = $"{baseUrl}/verify-email?token={Uri.EscapeDataString(token)}";
                var html = $@"
<!DOCTYPE html>
<html><body style='font-family:Arial,sans-serif'>
<h2>E-poçtunuzu təsdiqləyin</h2>
<p>Salam,</p>
<p>Easy Step ERP hesabınızı aktivləşdirmək üçün aşağıdakı linkə keçid edin:</p>
<p><a href='{verifyUrl}'>{verifyUrl}</a></p>
<p>Link 24 saat ərzində keçərlidir.</p>
<p>Əgər bu qeydiyyat sizdən gəlməyibsə, bu e-poçtu nəzərə almayın.</p>
<p>— Easy Step ERP<br/>hello@easysteperp.com</p>
</body></html>";
                var to = req.Email;
                var subject = "Easy Step ERP - E-poçt təsdiqi";
                _ = Task.Run(async () =>
                {
                    try { await _email.SendAsync(to, subject, html, CancellationToken.None); }
                    catch (Exception ex) { _logger.LogError(ex, "Background email send failed for {To}", to); }
                });
            }

            return Ok(new { message = "Qeydiyyat uğurla tamamlandı. E-poçtunuzu yoxlayın və təsdiq linkinə keçid edin." });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Qeydiyyat zamanı xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin." });
        }
    }

    [HttpPost("register-affiliate")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
    public async Task<IActionResult> RegisterAffiliate([FromBody] RegisterAffiliateRequest? req, CancellationToken ct)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { message = "E-poçt və şifrə tələb olunur" });
        if (!req.AcceptTerms)
            return BadRequest(new { message = "Şərtləri qəbul etməlisiniz" });
        if ((req.Password ?? "").Length < 12)
            return BadRequest(new { message = "Şifrə minimum 12 simvol olmalıdır" });

        try
        {
            var (ok, token, errorCode) = await _auth.RegisterAffiliateAsync(req, ct);
            if (!ok)
                return BadRequest(new { message = errorCode switch
                {
                    "EmailExists" => "Bu e-poçt artıq qeydiyyatdadır",
                    "PasswordTooShort" => "Şifrə minimum 12 simvol olmalıdır",
                    "InvalidEmail" => "E-poçt daxil edin",
                    _ => "Satış partnyoru qeydiyyatı müvəqqəti olaraq mövcud deyil"
                } });

            if (!string.IsNullOrEmpty(token))
            {
                var baseUrl = _config["App:BaseUrl"] ?? "https://www.easysteperp.com";
                var verifyUrl = $"{baseUrl}/verify-email?token={Uri.EscapeDataString(token)}";
                var html = $@"
<!DOCTYPE html>
<html><body style='font-family:Arial,sans-serif'>
<h2>E-poçtunuzu təsdiqləyin</h2>
<p>Salam,</p>
<p>Easy Step ERP satış partnyoru hesabınızı aktivləşdirmək üçün aşağıdakı linkə keçid edin:</p>
<p><a href='{verifyUrl}'>{verifyUrl}</a></p>
<p>Link 24 saat ərzində keçərlidir.</p>
<p>— Easy Step ERP<br/>hello@easysteperp.com</p>
</body></html>";
                var to = req.Email;
                var subject = "Easy Step ERP - Satış partnyoru e-poçt təsdiqi";
                _ = Task.Run(async () =>
                {
                    try { await _email.SendAsync(to, subject, html, CancellationToken.None); }
                    catch (Exception ex) { _logger.LogError(ex, "Background email send failed for affiliate {To}", to); }
                });
            }

            return Ok(new { message = "Satış partnyoru qeydiyyatı uğurla tamamlandı. E-poçtunuzu yoxlayın və təsdiq linkinə keçid edin." });
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "RegisterAffiliate DbUpdateException for {Email}", req.Email);
            var inner = ex.InnerException?.Message ?? ex.Message;
            // PostgreSQL unique violation 23505, or message contains Email/unique
            if (inner.Contains("23505") || inner.Contains("Email", StringComparison.OrdinalIgnoreCase)
                || inner.Contains("IX_Users_Email", StringComparison.OrdinalIgnoreCase)
                || inner.Contains("unique", StringComparison.OrdinalIgnoreCase)
                || inner.Contains("duplicate key", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Bu e-poçt artıq qeydiyyatdadır" });
            return StatusCode(500, new { message = "Qeydiyyat zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "RegisterAffiliate failed for {Email}", req.Email);
            var msg = "Qeydiyyat zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.";
            var detail = ex.InnerException?.Message ?? ex.Message;
            return StatusCode(500, new { message = msg, debug = detail });
        }
    }

    [HttpPost("login")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
    public async Task<IActionResult> Login([FromBody] LoginRequest? req, CancellationToken ct)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { message = "E-poçt və şifrə tələb olunur" });
        try
        {
        var result = await _auth.ValidateLoginAsync(req.Email, req.Password ?? "", ct);
        if (result is not { } r)
            return Unauthorized(new { message = "E-poçt və ya şifrə səhvdir" });

        var (user, tenant) = r;
        if (user == null)
            return Unauthorized(new { message = "Hesab tapılmadı" });
        if (!user.EmailVerified)
            return Unauthorized(new { message = "E-poçtunuz təsdiq olunmayıb. E-poçtunuzu yoxlayın və təsdiq linkinə keçid edin." });
        if (tenant == null)
            return Unauthorized(new { message = "Hesab tapılmadı" });

        if (user.TwoFactorEnabled)
        {
            var pendingToken = _auth.GeneratePending2FAToken(user);
            if (user.TwoFactorViaEmail)
            {
                var code = await _auth.CreateAndStoreEmailOtpAsync(user.Id, ct);
                if (!string.IsNullOrEmpty(code))
                {
                    var html = $@"
<!DOCTYPE html>
<html><body style='font-family:Arial,sans-serif'>
<h2>Daxil olma kodu</h2>
<p>Salam,</p>
<p>Easy Step ERP daxil olma kodunuz: <strong>{code}</strong></p>
<p>Kod 10 dəqiqə ərzində keçərlidir.</p>
<p>Əgər bu tələb sizdən gəlməyibsə, bu e-poçtu nəzərə almayın.</p>
<p>— Easy Step ERP<br/>hello@easysteperp.com</p>
</body></html>";
                    await _email.SendAsync(user.Email, "Easy Step ERP - Daxil olma kodu", html, ct);
                }
                return Ok(new { requires2FA = true, pendingToken, message = "E-poçtunuza göndərilən 6 rəqəmli kodu daxil edin.", viaEmail = true });
            }
            return Ok(new { requires2FA = true, pendingToken, message = "2FA kodunu daxil edin (Authenticator app)", viaEmail = false });
        }

        await _auth.UpdateLastLoginAsync(user.Id, ct);

        try
        {
            await _audit.LogAsync("Login", user.Id, user.Email,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                HttpContext.Request.Headers.UserAgent,
                ct: default);
        }
        catch (Exception auditEx) { _logger.LogWarning(auditEx, "Audit log failed"); }

        var accessToken = _auth.GenerateAccessToken(user, tenant);
        var refreshToken = _auth.GenerateRefreshToken();
        await _auth.StoreRefreshTokenAsync(user.Id, refreshToken, ct);

        return Ok(new
        {
            accessToken,
            refreshToken,
            expiresIn = _auth.GetExpiresInSeconds(),
        });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login failed for {Email}: {Error}", req?.Email, ex.Message);
            return StatusCode(500, new {
                message = "Daxil olma zamanı xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.",
                error = ex.Message,
                inner = ex.InnerException?.Message,
            });
        }
    }

    [HttpPost("2fa/setup")]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Setup2FA([FromBody] Setup2FARequest? req, CancellationToken ct)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "";
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var id))
            return Unauthorized();

        var user = await _auth.GetUserByIdAsync(id, ct);
        if (user == null) return Unauthorized();

        if (req?.ViaEmail == true)
        {
            user.TwoFactorSecret = null;
            user.TwoFactorViaEmail = true;
            user.TwoFactorEnabled = false;
            await _auth.SaveChangesAsync(ct);
            var code = await _auth.CreateAndStoreEmailOtpAsync(user.Id, ct);
            if (!string.IsNullOrEmpty(code))
            {
                var html = $@"
<!DOCTYPE html>
<html><body style='font-family:Arial,sans-serif'>
<h2>2FA təsdiq kodu</h2>
<p>Salam,</p>
<p>Easy Step ERP 2FA aktivləşdirmə kodunuz: <strong>{code}</strong></p>
<p>Kodu quraşdırma səhifəsində daxil edin.</p>
<p>— Easy Step ERP<br/>hello@easysteperp.com</p>
</body></html>";
                await _email.SendAsync(user.Email, "Easy Step ERP - 2FA təsdiq kodu", html, ct);
            }
            return Ok(new { viaEmail = true, message = "Kod e-poçtunuza göndərildi. Kodu daxil edin." });
        }

        var (secret, qrCodeUrl) = _auth.GenerateTOTPSecret(email);
        user.TwoFactorSecret = secret;
        user.TwoFactorViaEmail = false;
        user.TwoFactorEnabled = false;
        await _auth.SaveChangesAsync(ct);

        return Ok(new { secret, qrCodeUrl, viaEmail = false, message = "QR kodu skan edin və kodu təsdiqləyin" });
    }

    [HttpPost("2fa/request-email-otp")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
    public async Task<IActionResult> RequestEmailOtp([FromBody] RequestEmailOtpRequest req, CancellationToken ct)
    {
        var user = await _auth.ValidatePending2FATokenAsync(req.PendingToken, ct);
        if (user == null)
            return Unauthorized(new { message = "Session vaxtı keçib. Yenidən daxil olun." });

        if (!user.TwoFactorEnabled)
            return BadRequest(new { message = "2FA aktiv deyil." });

        var code = await _auth.CreateAndStoreEmailOtpAsync(user.Id, ct);
        if (string.IsNullOrEmpty(code))
            return StatusCode(500, new { message = "Kod yaradıla bilmədi." });

        var html = $@"
<!DOCTYPE html>
<html><body style='font-family:Arial,sans-serif'>
<h2>Daxil olma kodu</h2>
<p>Salam,</p>
<p>Easy Step ERP daxil olma kodunuz: <strong>{code}</strong></p>
<p>Kod 10 dəqiqə ərzində keçərlidir.</p>
<p>Əgər bu tələb sizdən gəlməyibsə, bu e-poçtu nəzərə almayın.</p>
<p>— Easy Step ERP<br/>hello@easysteperp.com</p>
</body></html>";
        await _email.SendAsync(user.Email, "Easy Step ERP - Daxil olma kodu", html, ct);

        return Ok(new { message = "Kod e-poçtunuza göndərildi." });
    }

    [HttpPost("2fa/verify")]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Verify2FA([FromBody] Verify2FARequest req, CancellationToken ct)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var id))
            return Unauthorized();

        var user = await _auth.GetUserByIdAsync(id, ct);
        if (user == null)
            return Unauthorized();

        var valid = user.TwoFactorViaEmail
            ? await _auth.ValidateAndConsumeEmailOtpAsync(user.Id, req.Code, ct)
            : (!string.IsNullOrEmpty(user.TwoFactorSecret) && _auth.ValidateTOTP(user.TwoFactorSecret, req.Code));

        if (!valid)
            return BadRequest(new { message = "Kod səhvdir" });

        user.TwoFactorEnabled = true;
        await _auth.SaveChangesAsync(ct);

        return Ok(new { message = "2FA aktivləşdirildi" });
    }

    [HttpPost("2fa/send-disable-otp")]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> SendDisableOtp(CancellationToken ct)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var id))
            return Unauthorized();

        var user = await _auth.GetUserByIdAsync(id, ct);
        if (user == null || !user.TwoFactorViaEmail)
            return BadRequest(new { message = "Bu əməliyyat yalnız e-poçt 2FA üçündür." });

        var code = await _auth.CreateAndStoreEmailOtpAsync(user.Id, ct);
        if (string.IsNullOrEmpty(code))
            return StatusCode(500, new { message = "Kod yaradıla bilmədi." });

        var html = $@"
<!DOCTYPE html>
<html><body style='font-family:Arial,sans-serif'>
<h2>2FA söndürmə kodu</h2>
<p>Salam,</p>
<p>2FA söndürmək üçün kodunuz: <strong>{code}</strong></p>
<p>— Easy Step ERP<br/>hello@easysteperp.com</p>
</body></html>";
        await _email.SendAsync(user.Email, "Easy Step ERP - 2FA söndürmə kodu", html, ct);

        return Ok(new { message = "Kod e-poçtunuza göndərildi." });
    }

    [HttpPost("2fa/disable")]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Disable2FA([FromBody] Disable2FARequest req, CancellationToken ct)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var id))
            return Unauthorized();

        var user = await _auth.GetUserByIdAsync(id, ct);
        if (user == null) return Unauthorized();

        if (!_auth.VerifyPassword(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Şifrə səhvdir" });

        var valid = user.TwoFactorViaEmail
            ? await _auth.ValidateAndConsumeEmailOtpAsync(user.Id, req.Code, ct)
            : (!string.IsNullOrEmpty(user.TwoFactorSecret) && _auth.ValidateTOTP(user.TwoFactorSecret, req.Code));

        if (!valid)
            return BadRequest(new { message = "2FA kodu səhvdir" });

        user.TwoFactorEnabled = false;
        user.TwoFactorSecret = null;
        user.TwoFactorViaEmail = false;
        await _auth.SaveChangesAsync(ct);

        return Ok(new { message = "2FA deaktivləşdirildi" });
    }

    [HttpPost("2fa/complete")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
    public async Task<IActionResult> Complete2FA([FromBody] Complete2FARequest req, CancellationToken ct)
    {
        var user = await _auth.ValidatePending2FATokenAsync(req.PendingToken, ct);
        if (user == null)
            return Unauthorized(new { message = "Session vaxtı keçib. Yenidən daxil olun." });

        var valid = user.TwoFactorViaEmail
            ? await _auth.ValidateAndConsumeEmailOtpAsync(user.Id, req.Code, ct)
            : (!string.IsNullOrEmpty(user.TwoFactorSecret) && _auth.ValidateTOTP(user.TwoFactorSecret, req.Code));

        if (!valid)
            return Unauthorized(new { message = "2FA kodu səhvdir" });

        await _auth.UpdateLastLoginAsync(user.Id, ct);

        await _audit.LogAsync("Login", user.Id, user.Email,
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            HttpContext.Request.Headers.UserAgent,
            ct: default);

        var accessToken = _auth.GenerateAccessToken(user, user.Tenant);
        var refreshToken = _auth.GenerateRefreshToken();
        await _auth.StoreRefreshTokenAsync(user.Id, refreshToken, ct);

        return Ok(new
        {
            accessToken,
            refreshToken,
            expiresIn = _auth.GetExpiresInSeconds(),
        });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.RefreshToken))
            return Unauthorized(new { message = "Refresh token tələb olunur" });

        var result = await _auth.ValidateRefreshTokenAsync(req.RefreshToken, ct);
        if (result is not { } r)
            return Unauthorized(new { message = "Refresh token etibarsız və ya vaxtı keçib" });

        var (user, tenant) = r;
        if (tenant == null)
            return Unauthorized();

        var accessToken = _auth.GenerateAccessToken(user!, tenant);
        var refreshToken = _auth.GenerateRefreshToken();
        await _auth.StoreRefreshTokenAsync(user!.Id, refreshToken, ct);

        return Ok(new
        {
            accessToken,
            refreshToken,
            expiresIn = _auth.GetExpiresInSeconds(),
        });
    }

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public IActionResult Me()
    {
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "";
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "";
        var tenantId = User.FindFirst("tenant_id")?.Value ?? "";
        return Ok(new { email, role, tenantId });
    }

    [HttpPost("logout")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId) && Guid.TryParse(userId, out var id))
            await _auth.RevokeAllRefreshTokensForUserAsync(id, ct);
        return Ok(new { message = "Çıxış edildi" });
    }

    [HttpPost("forgot-password")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req, CancellationToken ct)
    {
        var token = await _auth.CreatePasswordResetTokenAsync(req.Email, ct);
        if (token != null)
        {
            var baseUrl = _config["App:BaseUrl"] ?? "http://localhost:3000";
            var resetUrl = $"{baseUrl}/reset-password?token={Uri.EscapeDataString(token)}";
            var html = $@"
<!DOCTYPE html>
<html><body style='font-family:Arial,sans-serif'>
<h2>Şifrə sıfırlama</h2>
<p>Şifrənizi sıfırlamaq üçün aşağıdakı linkə keçid edin:</p>
<p><a href='{resetUrl}'>{resetUrl}</a></p>
<p>Link 1 saat ərzində keçərlidir.</p>
<p>Əgər bu tələb sizdən gəlməyibsə, bu e-poçtu nəzərə almayın.</p>
<p>— Easy Step ERP</p>
</body></html>";
            var to = req.Email;
            var subject = "Easy Step ERP - Şifrə sıfırlama";
            _ = Task.Run(async () =>
            {
                try { await _email.SendAsync(to, subject, html, CancellationToken.None); }
                catch (Exception ex) { _logger.LogError(ex, "Background forgot-password email failed for {To}", to); }
            });
        }
        return Ok(new { message = "Şifrə sıfırlama linki e-poçtunuza göndərildi." });
    }

    [HttpPost("reset-password")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Token) || string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword.Length < 6)
            return BadRequest(new { message = "Token və ən azı 6 simvoldan ibarət yeni şifrə tələb olunur" });

        var userId = await _auth.ValidateAndConsumeResetTokenAsync(req.Token, ct);
        if (userId == null)
            return BadRequest(new { message = "Link etibarsız və ya vaxtı keçib. Yenidən cəhd edin." });

        if (!await _auth.ResetPasswordAsync(userId.Value, req.NewPassword, ct))
            return BadRequest(new { message = "Xəta baş verdi" });

        return Ok(new { message = "Şifrə uğurla dəyişdirildi" });
    }

    [HttpPost("verify-email")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Token))
            return BadRequest(new { message = "Token tələb olunur" });

        var userId = await _auth.ValidateAndConsumeEmailVerificationTokenAsync(req.Token, ct);
        if (userId == null)
            return BadRequest(new { message = "Link etibarsız və ya vaxtı keçib. Yenidən qeydiyyatdan keçin və ya bizimlə əlaqə saxlayın." });

        if (!await _auth.MarkEmailVerifiedAsync(userId.Value, ct))
            return BadRequest(new { message = "Xəta baş verdi" });

        return Ok(new { message = "E-poçtunuz təsdiqləndi. İndi daxil ola bilərsiniz." });
    }
}

public record ForgotPasswordRequest(string Email);

public record VerifyEmailRequest(string Token);

public record ResetPasswordRequest(string Token, string NewPassword);

public record LoginRequest(string Email, string Password);

public record RefreshRequest(string RefreshToken);

public record Complete2FARequest(string PendingToken, string Code);

public record Setup2FARequest(bool? ViaEmail);

public record RequestEmailOtpRequest(string PendingToken);

public record Verify2FARequest(string Code);

public record Disable2FARequest(string Password, string Code);
