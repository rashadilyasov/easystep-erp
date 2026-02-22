using System.Collections.Generic;
using EasyStep.Erp.Api.Entities;
using EasyStep.Erp.Api.Services;
using Microsoft.AspNetCore.Authorization;
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
    private readonly ITemplatedEmailService _templatedEmail;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AuthService auth, AuditService audit, IEmailService email, ITemplatedEmailService templatedEmail, IConfiguration config, ILogger<AuthController> logger)
    {
        _auth = auth;
        _audit = audit;
        _email = email;
        _templatedEmail = templatedEmail;
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
                return BadRequest(new { message = errorCode == "PromoCodeAlreadyUsed" ? "Bu promo kod artıq istifadə olunub" : errorCode == "InvalidPromoCode" ? "Promo kod mövcud deyil" : "Bu e-poçt artıq qeydiyyatdadır" });

            if (!string.IsNullOrEmpty(token))
            {
                var baseUrl = _config["App:BaseUrl"] ?? "https://www.easysteperp.com";
                var verifyUrl = $"{baseUrl}/verify-email?token={Uri.EscapeDataString(token)}";
                var to = req.Email;
                var userName = req.ContactPerson?.Trim() ?? "Müştəri";
                try
                {
                    var sent = await _templatedEmail.SendTemplatedAsync(to, EmailTemplateKeys.Verification, new Dictionary<string, string> { ["verifyUrl"] = verifyUrl, ["userName"] = userName }, ct);
                    if (!sent)
                        return StatusCode(500, new { message = "Təsdiq e-poçtu göndərilə bilmədi. E-poçt ayarlarını yoxlayın (Admin → E-poçt ayarları)." });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Verification email failed for {To}", to);
                    return StatusCode(500, new { message = "Təsdiq e-poçtu göndərilə bilmədi. E-poçt ayarlarını yoxlayın." });
                }
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
        if (!req.Age18Confirmed)
            return BadRequest(new { message = "18 yaşdan yuxarı olduğunuzu təsdiqləməlisiniz" });
        if (!AuthService.IsStrongPassword(req.Password))
            return BadRequest(new { message = (req.Password ?? "").Length < 12 ? "Şifrə minimum 12 simvol olmalıdır" : "Şifrə böyük hərf, kiçik hərf və rəqəm əlavə edin" });

        try
        {
            var (ok, token, errorCode) = await _auth.RegisterAffiliateAsync(req, ct);
            if (!ok)
                return BadRequest(new { message = errorCode switch
                {
                    "EmailExists" => "Bu e-poçt artıq qeydiyyatdadır",
                    "PasswordTooShort" => "Şifrə minimum 12 simvol olmalıdır",
                    "PasswordTooWeak" => "Şifrə böyük hərf, kiçik hərf və rəqəm əlavə edin",
                    "InvalidEmail" => "E-poçt daxil edin",
                    _ => "Satış partnyoru qeydiyyatı müvəqqəti olaraq mövcud deyil"
                } });

            if (!string.IsNullOrEmpty(token))
            {
                var baseUrl = _config["App:BaseUrl"] ?? "https://www.easysteperp.com";
                var verifyUrl = $"{baseUrl}/verify-email?token={Uri.EscapeDataString(token)}";
                var to = req.Email;
                var userName = req.FullName?.Trim() ?? "Partnyor";
                try
                {
                    var sent = await _templatedEmail.SendTemplatedAsync(to, EmailTemplateKeys.AffiliateVerification, new Dictionary<string, string> { ["verifyUrl"] = verifyUrl, ["userName"] = userName }, ct);
                    if (!sent)
                        return StatusCode(500, new { message = "Təsdiq e-poçtu göndərilə bilmədi. E-poçt ayarlarını yoxlayın (Admin → E-poçt ayarları)." });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Affiliate verification email failed for {To}", to);
                    return StatusCode(500, new { message = "Təsdiq e-poçtu göndərilə bilmədi. E-poçt ayarlarını yoxlayın." });
                }
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
                    var userName = (tenant?.ContactPerson ?? "").Trim();
                    if (string.IsNullOrEmpty(userName)) userName = user.Role == UserRole.Affiliate ? "Partnyor" : "Müştəri";
                    await _templatedEmail.SendTemplatedAsync(user.Email, EmailTemplateKeys.LoginOtp, new Dictionary<string, string> { ["code"] = code, ["userName"] = userName }, ct);
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
    [Authorize]
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
                var userWithTenant = await _auth.GetUserWithTenantByIdAsync(id, ct);
                var userName = (userWithTenant?.tenant?.ContactPerson ?? "").Trim();
                if (string.IsNullOrEmpty(userName)) userName = "İstifadəçi";
                await _templatedEmail.SendTemplatedAsync(user.Email, EmailTemplateKeys.TwoFaConfirm, new Dictionary<string, string> { ["code"] = code, ["userName"] = userName }, ct);
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

        var userWithTenant = await _auth.GetUserWithTenantByIdAsync(user.Id, ct);
        var userName = (userWithTenant?.tenant?.ContactPerson ?? "").Trim();
        if (string.IsNullOrEmpty(userName)) userName = user.Role == UserRole.Affiliate ? "Partnyor" : "İstifadəçi";
        await _templatedEmail.SendTemplatedAsync(user.Email, EmailTemplateKeys.LoginOtp, new Dictionary<string, string> { ["code"] = code, ["userName"] = userName }, ct);

        return Ok(new { message = "Kod e-poçtunuza göndərildi." });
    }

    [HttpPost("2fa/verify")]
    [Authorize]
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
    [Authorize]
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

        var userWithTenant = await _auth.GetUserWithTenantByIdAsync(id, ct);
        var userName = (userWithTenant?.tenant?.ContactPerson ?? "").Trim();
        if (string.IsNullOrEmpty(userName)) userName = "İstifadəçi";
        await _templatedEmail.SendTemplatedAsync(user.Email, EmailTemplateKeys.TwoFaDisable, new Dictionary<string, string> { ["code"] = code, ["userName"] = userName }, ct);

        return Ok(new { message = "Kod e-poçtunuza göndərildi." });
    }

    [HttpPost("2fa/disable")]
    [Authorize]
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
            var to = req.Email;
            var userWithTenant = await _auth.GetUserWithTenantByEmailAsync(req.Email, ct);
            var userName = (userWithTenant?.tenant?.ContactPerson ?? "").Trim();
            if (string.IsNullOrEmpty(userName)) userName = "Müştəri";
            _ = Task.Run(async () =>
            {
                try { await _templatedEmail.SendTemplatedAsync(to, EmailTemplateKeys.PasswordReset, new Dictionary<string, string> { ["resetUrl"] = resetUrl, ["userName"] = userName }, CancellationToken.None); }
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

    [HttpPost("accept-invite")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
    public async Task<IActionResult> AcceptInvite([FromBody] AcceptInviteRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Token) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Token və şifrə tələb olunur." });

        var (errorCode, userId) = await _auth.ValidateInviteAndCreateUserAsync(req.Token, req.Password, ct);
        if (errorCode != null)
        {
            var msg = errorCode switch
            {
                "InvalidToken" => "Link etibarsız və ya vaxtı keçib.",
                "TokenExpired" => "Link vaxtı keçib. Yeni dəvət tələb edin.",
                "EmailExists" => "Bu e-poçt artıq qeydiyyatdadır.",
                "PasswordTooShort" => "Şifrə minimum 12 simvol olmalıdır.",
                "PasswordTooWeak" => "Şifrədə böyük hərf, kiçik hərf və rəqəm olmalıdır.",
                _ => "Xəta baş verdi.",
            };
            return BadRequest(new { message = msg });
        }

        var r = await _auth.GetUserWithTenantByIdAsync(userId!.Value, ct);
        if (r == null || r.Value.user == null || r.Value.tenant == null)
            return BadRequest(new { message = "Xəta baş verdi." });

        var (u, t) = r.Value;
        var accessToken = _auth.GenerateAccessToken(u!, t!);
        var refreshToken = _auth.GenerateRefreshToken();
        await _auth.StoreRefreshTokenAsync(u!.Id, refreshToken, ct);

        return Ok(new { accessToken, refreshToken, expiresIn = _auth.GetExpiresInSeconds(), message = "Qeydiyyat tamamlandı. İndi daxil ola bilərsiniz." });
    }
}

public record AcceptInviteRequest(string Token, string Password);

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
