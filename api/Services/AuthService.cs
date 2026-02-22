using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OtpNet;

namespace EasyStep.Erp.Api.Services;

public class AuthService
{
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _config;
    private readonly AffiliateService _affiliate;
    private readonly AuditService _audit;

    public AuthService(ApplicationDbContext db, IConfiguration config, AffiliateService affiliate, AuditService audit)
    {
        _db = db;
        _config = config;
        _affiliate = affiliate;
        _audit = audit;
    }

    public string HashPassword(string password) => BCrypt.Net.BCrypt.HashPassword(password, 12);
    public bool VerifyPassword(string password, string hash) => BCrypt.Net.BCrypt.Verify(password, hash);

    /// <summary>Güclü şifrə: min 12 simvol, böyük hərf, kiçik hərf, rəqəm.</summary>
    public static bool IsStrongPassword(string? p)
    {
        if (string.IsNullOrEmpty(p) || p.Length < 12) return false;
        if (!p.Any(char.IsUpper)) return false;
        if (!p.Any(char.IsLower)) return false;
        if (!p.Any(char.IsDigit)) return false;
        return true;
    }

    public string GenerateAccessToken(User user, Tenant tenant)
    {
        var key = _config["Jwt:Key"] ?? "easystep-erp-secret-key-min-32-chars!!";
        var expiry = int.Parse(_config["Jwt:ExpiryMinutes"] ?? "60");

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("tenant_id", tenant.Id.ToString()),
        };

        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? _config["Jwt_Issuer"] ?? "EasyStepErp",
            claims: claims.ToArray(),
            expires: DateTime.UtcNow.AddMinutes(expiry),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

    public static string HashRefreshToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public async Task StoreRefreshTokenAsync(Guid userId, string token, CancellationToken ct = default)
    {
        var expiryDays = int.Parse(_config["Jwt:RefreshTokenExpiryDays"] ?? "7");
        _db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = HashRefreshToken(token),
            ExpiresAt = DateTime.UtcNow.AddDays(expiryDays),
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);
    }

    public async Task<(User? User, Tenant? Tenant)?> ValidateRefreshTokenAsync(string token, CancellationToken ct = default)
    {
        var hash = HashRefreshToken(token);
        var now = DateTime.UtcNow;

        var rt = await _db.RefreshTokens
            .Include(r => r.User).ThenInclude(u => u.Tenant)
            .FirstOrDefaultAsync(r => r.TokenHash == hash && r.ExpiresAt > now && r.RevokedAt == null, ct);

        if (rt == null)
            return null;

        rt.RevokedAt = now;
        await _db.SaveChangesAsync(ct);

        return (rt.User, rt.User.Tenant);
    }

    public async Task<User?> GetUserByIdAsync(Guid id, CancellationToken ct = default) =>
        await _db.Users.Include(u => u.Tenant).FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);

    public async Task RevokeAllRefreshTokensForUserAsync(Guid userId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        await _db.RefreshTokens
            .Where(r => r.UserId == userId && r.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.RevokedAt, now), ct);
    }

    public async Task<(User? User, Tenant? Tenant)?> ValidateLoginAsync(string email, string password, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user == null)
            return null;
        if (!VerifyPassword(password, user.PasswordHash))
            return null;
        return (user, user.Tenant);
    }

    public async Task<(bool Ok, string? VerificationToken, string? ErrorCode)> RegisterAsync(RegisterRequest req, CancellationToken ct = default)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email, ct))
            return (false, null, "EmailExists");

        if (!string.IsNullOrWhiteSpace(req.PromoCode))
        {
            var (status, _) = await _affiliate.GetPromoCodeStatusAsync(req.PromoCode.Trim(), ct);
            if (status == AffiliateService.PromoCodeCheckStatus.NotFound)
                return (false, null, "InvalidPromoCode");
            if (status == AffiliateService.PromoCodeCheckStatus.AlreadyUsed)
                return (false, null, "PromoCodeAlreadyUsed");
        }

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = req.CompanyName,
            ContactPerson = req.ContactPerson,
            TaxId = req.TaxId,
            Country = req.Country ?? "Azərbaycan",
            City = req.City,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Email = req.Email,
            PasswordHash = HashPassword(req.Password),
            Role = UserRole.CustomerAdmin,
            EmailVerified = false,
            TwoFactorEnabled = false,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Tenants.Add(tenant);
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        if (!string.IsNullOrWhiteSpace(req.PromoCode))
        {
            var used = await _affiliate.UsePromoCodeForTenantAsync(req.PromoCode.Trim(), tenant.Id, ct);
            if (used)
                await _audit.LogAsync("PromoCodeUsed", null, req.Email, metadata: $"code={req.PromoCode.Trim().ToUpperInvariant()} tenantId={tenant.Id} tenantName={tenant.Name}", ct: ct);
        }

        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(24)).Replace("+", "-").Replace("/", "_").TrimEnd('=');
        var expiryHours = int.Parse(_config["Auth:EmailVerificationExpiryHours"] ?? "24");
        _db.EmailVerificationTokens.Add(new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = HashPasswordResetToken(token),
            ExpiresAt = DateTime.UtcNow.AddHours(expiryHours),
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);

        return (true, token, null);
    }

    public async Task<(bool Ok, string? VerificationToken, string? ErrorCode)> RegisterAffiliateAsync(RegisterAffiliateRequest req, CancellationToken ct = default)
    {
        var emailLower = (req.Email ?? "").Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(emailLower))
            return (false, null, "InvalidEmail");
        if (!IsStrongPassword(req.Password))
            return (false, null, (req.Password ?? "").Length < 12 ? "PasswordTooShort" : "PasswordTooWeak");
        var emailTrim = (req.Email ?? "").Trim();
        if (await _db.Users.AnyAsync(u => u.Email.ToLower() == emailLower, ct))
            return (false, null, "EmailExists");

        var affTenantId = DbInitializer.AffiliatesTenantId;
        var tenantExists = await _db.Tenants.AnyAsync(t => t.Id == affTenantId, ct);
        if (!tenantExists)
            return (false, null, "AffiliateSystemNotReady");

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = affTenantId,
            Email = emailTrim,
            PasswordHash = HashPassword(req.Password ?? ""),
            Role = UserRole.Affiliate,
            EmailVerified = false,
            TwoFactorEnabled = false,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Users.Add(user);

        var affiliate = new Affiliate
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            IsApproved = false,
            BalanceTotal = 0,
            BalancePending = 0,
            BalanceBonus = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.Affiliates.Add(affiliate);

        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(24)).Replace("+", "-").Replace("/", "_").TrimEnd('=');
        var expiryHours = int.Parse(_config["Auth:EmailVerificationExpiryHours"] ?? "24");
        _db.EmailVerificationTokens.Add(new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = HashPasswordResetToken(token),
            ExpiresAt = DateTime.UtcNow.AddHours(expiryHours),
            CreatedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);
        return (true, token, null);
    }

    public async Task<Guid?> ValidateAndConsumeEmailVerificationTokenAsync(string token, CancellationToken ct = default)
    {
        var hash = HashPasswordResetToken(token);
        var now = DateTime.UtcNow;

        var evt = await _db.EmailVerificationTokens
            .FirstOrDefaultAsync(t => t.TokenHash == hash && t.ExpiresAt > now && t.UsedAt == null, ct);

        if (evt == null)
            return null;

        evt.UsedAt = now;
        await _db.SaveChangesAsync(ct);
        return evt.UserId;
    }

    public async Task<bool> MarkEmailVerifiedAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        if (user == null) return false;
        user.EmailVerified = true;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    /// <summary>Yeni e-poçt təsdiq tokenu yaradır (admin təkrar göndərmə üçün).</summary>
    public async Task<string?> CreateEmailVerificationTokenForUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        if (user == null) return null;

        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(24)).Replace("+", "-").Replace("/", "_").TrimEnd('=');
        var expiryHours = int.Parse(_config["Auth:EmailVerificationExpiryHours"] ?? "24");
        _db.EmailVerificationTokens.Add(new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = HashPasswordResetToken(token),
            ExpiresAt = DateTime.UtcNow.AddHours(expiryHours),
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);
        return token;
    }

    public async Task UpdateLastLoginAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        if (user != null)
        {
            user.LastLoginAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
    }

    public int GetExpiresInSeconds()
    {
        var mins = int.Parse(_config["Jwt:ExpiryMinutes"] ?? "60");
        return mins * 60;
    }

    public (string Secret, string QrCodeUrl) GenerateTOTPSecret(string email)
    {
        var key = KeyGeneration.GenerateRandomKey(20);
        var secret = Base32Encoding.ToString(key);
        var issuer = _config["Jwt:Issuer"] ?? "EasyStepERP";
        var qrUrl = $"otpauth://totp/{issuer}:{Uri.EscapeDataString(email)}?secret={secret}&issuer={Uri.EscapeDataString(issuer)}";
        return (secret, qrUrl);
    }

    public bool ValidateTOTP(string secret, string code)
    {
        if (string.IsNullOrEmpty(secret) || string.IsNullOrEmpty(code) || code.Length != 6)
            return false;
        try
        {
            var key = Base32Encoding.ToBytes(secret);
            var totp = new Totp(key);
            return totp.VerifyTotp(code, out _, new VerificationWindow(1, 1));
        }
        catch { return false; }
    }

    public string GeneratePending2FAToken(User user)
    {
        var key = _config["Jwt:Key"] ?? "easystep-erp-secret-key-min-32-chars!!";
        var claims = new List<Claim>
        {
            new("2fa_pending", "1"),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
        };
        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            claims: claims.ToArray(),
            expires: DateTime.UtcNow.AddMinutes(3),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<User?> ValidatePending2FATokenAsync(string token, CancellationToken ct = default)
    {
        var key = _config["Jwt:Key"] ?? "easystep-erp-secret-key-min-32-chars!!";
        var handler = new JwtSecurityTokenHandler();
        try
        {
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            }, out _);
            if (principal?.FindFirst("2fa_pending")?.Value != "1") return null;
            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var id)) return null;
            return await _db.Users.Include(u => u.Tenant).FirstOrDefaultAsync(u => u.Id == id, ct);
        }
        catch { return null; }
    }

    public static string HashPasswordResetToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    /// <summary>E-poçta görə user və tenant. ForgotPassword üçün userName əldə etmək.</summary>
    public async Task<(User? user, Tenant? tenant)?> GetUserWithTenantByEmailAsync(string email, CancellationToken ct = default)
    {
        var user = await _db.Users.Include(u => u.Tenant).FirstOrDefaultAsync(u => u.Email == email, ct);
        return user != null ? (user, user.Tenant) : null;
    }

    /// <summary>Id-yə görə user və tenant. 2FA/Load user name üçün.</summary>
    public async Task<(User? user, Tenant? tenant)?> GetUserWithTenantByIdAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.Include(u => u.Tenant).FirstOrDefaultAsync(u => u.Id == userId, ct);
        return user != null ? (user, user.Tenant) : null;
    }

    public async Task<string?> CreatePasswordResetTokenAsync(string email, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user == null)
            return null;

        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(24)).Replace("+", "-").Replace("/", "_").TrimEnd('=');
        var expiryHours = int.Parse(_config["Auth:PasswordResetExpiryHours"] ?? "1");
        _db.PasswordResetTokens.Add(new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = HashPasswordResetToken(token),
            ExpiresAt = DateTime.UtcNow.AddHours(expiryHours),
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);
        return token;
    }

    public async Task<Guid?> ValidateAndConsumeResetTokenAsync(string token, CancellationToken ct = default)
    {
        var hash = HashPasswordResetToken(token);
        var now = DateTime.UtcNow;

        var prt = await _db.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.TokenHash == hash && t.ExpiresAt > now && t.UsedAt == null, ct);

        if (prt == null)
            return null;

        prt.UsedAt = now;
        await _db.SaveChangesAsync(ct);
        return prt.UserId;
    }

    public async Task<bool> ResetPasswordAsync(Guid userId, string newPassword, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        if (user == null)
            return false;

        user.PasswordHash = HashPassword(newPassword);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<string?> CreateAndStoreEmailOtpAsync(Guid userId, CancellationToken ct = default)
    {
        var code = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        var hash = HashPasswordResetToken(code);
        var expiryMins = int.Parse(_config["Auth:EmailOtpExpiryMinutes"] ?? "10");
        _db.EmailOtpCodes.Add(new EmailOtpCode
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CodeHash = hash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMins),
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);
        return code;
    }

    public async Task<bool> ValidateAndConsumeEmailOtpAsync(Guid userId, string code, CancellationToken ct = default)
    {
        var hash = HashPasswordResetToken(code);
        var now = DateTime.UtcNow;
        var otp = await _db.EmailOtpCodes
            .FirstOrDefaultAsync(o => o.UserId == userId && o.CodeHash == hash && o.ExpiresAt > now && o.UsedAt == null, ct);
        if (otp == null) return false;
        otp.UsedAt = now;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    /// <summary>İstifadəçi dəvəti üçün imzalı token yaradır (7 gün keçərli).</summary>
    public string GenerateInviteToken(Guid tenantId, string email, UserRole role)
    {
        var key = _config["Jwt:Key"] ?? "easystep-erp-secret-key-min-32-chars!!";
        var exp = DateTimeOffset.UtcNow.AddDays(7).ToUnixTimeSeconds();
        var payload = $"{tenantId}|{(email ?? "").Trim().ToLowerInvariant()}|{role}|{exp}";
        var payloadB64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(payload)).Replace("+", "-").Replace("/", "_").TrimEnd('=');
        using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(key));
        var sig = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(payloadB64))).Replace("+", "-").Replace("/", "_").TrimEnd('=');
        return $"{payloadB64}.{sig}";
    }

    /// <summary>Dəvət tokenunu yoxlayır və istifadəçi yaradır. Uğursuzdursa (errorCode, null), uğurludursa (null, userId).</summary>
    public async Task<(string? ErrorCode, Guid? UserId)> ValidateInviteAndCreateUserAsync(string token, string password, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(password) || password.Length < 12)
            return ("InvalidRequest", null);
        if (!IsStrongPassword(password))
            return (password.Length < 12 ? "PasswordTooShort" : "PasswordTooWeak", null);

        var parts = token.Split('.');
        if (parts.Length != 2)
            return ("InvalidToken", null);

        var key = _config["Jwt:Key"] ?? "easystep-erp-secret-key-min-32-chars!!";
        using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(key));
        var expectedSig = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(parts[0]))).Replace("+", "-").Replace("/", "_").TrimEnd('=');
        if (parts[1] != expectedSig)
            return ("InvalidToken", null);

        try
        {
            var padding = 4 - (parts[0].Length % 4);
            if (padding < 4) parts[0] += new string('=', padding);
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(parts[0].Replace("-", "+").Replace("_", "/")));
            var segs = decoded.Split('|');
            if (segs.Length != 4) return ("InvalidToken", null);
            if (!Guid.TryParse(segs[0], out var tenantId)) return ("InvalidToken", null);
            var email = (segs[1] ?? "").Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(email)) return ("InvalidToken", null);
            if (!Enum.TryParse<UserRole>(segs[2], out var role) || role == UserRole.SuperAdmin || role == UserRole.Affiliate || role == UserRole.Visitor)
                return ("InvalidToken", null);
            if (!long.TryParse(segs[3], out var exp) || DateTimeOffset.UtcNow.ToUnixTimeSeconds() > exp)
                return ("TokenExpired", null);

            if (await _db.Users.AnyAsync(u => u.Email.ToLower() == email, ct))
                return ("EmailExists", null);

            var tenant = await _db.Tenants.FindAsync(new object[] { tenantId }, ct);
            if (tenant == null) return ("InvalidToken", null);

            var user = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Email = email,
                PasswordHash = HashPassword(password),
                Role = role,
                EmailVerified = true,
                TwoFactorEnabled = false,
                CreatedAt = DateTime.UtcNow,
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync(ct);
            await _audit.LogAsync("UserInviteAccepted", user.Id, user.Email, metadata: $"tenantId={tenantId} inviterRole=CustomerAdmin", ct: ct);
            return (null, user.Id);
        }
        catch
        {
            return ("InvalidToken", null);
        }
    }
}

public record RegisterAffiliateRequest(string Email, string Password, string FullName, bool AcceptTerms, bool Age18Confirmed = false);

public record RegisterRequest(
    string Email,
    string Password,
    string CompanyName,
    string ContactPerson,
    string? TaxId,
    string? Country,
    string? City,
    bool AcceptTerms,
    string? PromoCode = null
);
