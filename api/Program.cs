using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Services;
using EasyStep.Erp.Api;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Railway: PORT env; lokaldə 5000 (Development), prodda 8080
var port = Environment.GetEnvironmentVariable("PORT");
if (string.IsNullOrEmpty(port))
  port = builder.Environment.IsDevelopment() ? "5000" : "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// DbContext — Development-da SQLite, əks halda PostgreSQL (hosting üçün)
// Railway: ConnectionStrings, DATABASE_URL, DATABASE_PRIVATE_URL (hamısı dəstəklənir)
var conn = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? Environment.GetEnvironmentVariable("DATABASE_PRIVATE_URL")
    ?? Environment.GetEnvironmentVariable("PGDATABASE_URL")
    ?? "Host=localhost;Database=easystep_erp;Username=postgres;Password=postgres";
conn = (conn ?? "").Trim();
// postgresql:// URI → Npgsql key=value format (Railway DATABASE_URL)
if (conn.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) || conn.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
{
    try
    {
        var uri = new Uri(conn);
        var parts = uri.UserInfo?.Split(new[] { ':' }, 2) ?? Array.Empty<string>();
        var user = parts.Length > 0 ? Uri.UnescapeDataString(parts[0]) : "postgres";
        var pass = parts.Length > 1 ? Uri.UnescapeDataString(parts[1]) : "";
        var db = uri.AbsolutePath.TrimStart('/').Split('?')[0];
        if (string.IsNullOrEmpty(db)) db = "railway";
        conn = $"Host={uri.Host};Port={uri.Port};Database={db};Username={user};Password={pass};Ssl Mode=Require";
    }
    catch { /* keep original if parse fails */ }
}
var useSqlite = conn.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase)
    || conn.EndsWith(".db", StringComparison.OrdinalIgnoreCase);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (useSqlite)
        options.UseSqlite(conn);
    else
        options.UseNpgsql(conn, o => o.EnableRetryOnFailure(3, TimeSpan.FromSeconds(2), null));
});

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AuditService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<IPaymentProvider, PayriffService>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();

// Global exception handler — həmişə JSON qaytarır (HTML deyil)
builder.Services.AddExceptionHandler<JsonExceptionHandler>();

// Controllers
builder.Services.AddControllers();

// JWT — Jwt:Key (Jwt__Key) və Jwt_Key formatlarını dəstəkləyir
var jwtKey = builder.Configuration["Jwt:Key"] ?? builder.Configuration["Jwt_Key"] ?? "easystep-erp-secret-key-min-32-chars!!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", p => p.RequireRole("SuperAdmin"));
});

// Swagger + JWT
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Easy Step ERP API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        In = ParameterLocation.Header
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

// Rate limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(5);
        opt.PermitLimit = 10;
    });
});

// CORS — Cors:Origins + vercel.app, localhost, 127.0.0.1
static string[] GetCorsOrigins(IConfiguration config)
{
    var arr = config.GetSection("Cors:Origins").Get<string[]>();
    if (arr is { Length: > 0 }) return arr;
    var list = new List<string>();
    for (var i = 0; i < 10; i++)
    {
        var v = config["Cors:Origins:" + i] ?? config["Cors_Origins_" + i];
        if (string.IsNullOrEmpty(v)) break;
        list.Add(v);
    }
    return list.Count > 0 ? list.ToArray() : new[] { "http://localhost:3000" };
}
static bool IsAllowedOrigin(string? origin)
{
    if (string.IsNullOrEmpty(origin)) return false;
    if (origin == "http://localhost:3000" || origin == "http://127.0.0.1:3000") return true;
    if (origin.StartsWith("https://", StringComparison.OrdinalIgnoreCase) &&
        (origin.Contains("easysteperp.com", StringComparison.OrdinalIgnoreCase) ||
         origin.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase)))
        return true;
    return false;
}
var corsOrigins = GetCorsOrigins(builder.Configuration);
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .SetIsOriginAllowed(origin => IsAllowedOrigin(origin) || corsOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseExceptionHandler();

// Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Migrations + seed — startup-da, login işləməzdən əvvəl
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        if (useSqlite)
        {
            await db.Database.EnsureCreatedAsync();
            // Ensure SiteContents table exists (EnsureCreated doesn't add to existing DB)
            await db.Database.ExecuteSqlRawAsync(
                "CREATE TABLE IF NOT EXISTS SiteContents (Id TEXT PRIMARY KEY, [Key] TEXT UNIQUE NOT NULL, Value TEXT NOT NULL, UpdatedAt TEXT NOT NULL)");
            await DbInitializer.SeedAsync(db);
        }
        else
        {
            await db.Database.MigrateAsync();
            // Repair: create missing token tables if migration history got out of sync (PostgreSQL)
            try
            {
                await db.Database.ExecuteSqlRawAsync(
                    @"CREATE TABLE IF NOT EXISTS ""RefreshTokens"" (""Id"" uuid NOT NULL, ""UserId"" uuid NOT NULL, ""TokenHash"" text NOT NULL, ""ExpiresAt"" timestamp with time zone NOT NULL, ""RevokedAt"" timestamp with time zone, ""CreatedAt"" timestamp with time zone NOT NULL, CONSTRAINT ""PK_RefreshTokens"" PRIMARY KEY (""Id""), CONSTRAINT ""FK_RefreshTokens_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE)");
                await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_RefreshTokens_ExpiresAt"" ON ""RefreshTokens"" (""ExpiresAt"")");
                await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_RefreshTokens_UserId"" ON ""RefreshTokens"" (""UserId"")");
            }
            catch (Exception ex) { logger.LogDebug(ex, "RefreshTokens repair skipped"); }
            try
            {
                await db.Database.ExecuteSqlRawAsync(
                    @"CREATE TABLE IF NOT EXISTS ""PasswordResetTokens"" (""Id"" uuid NOT NULL, ""UserId"" uuid NOT NULL, ""TokenHash"" text NOT NULL, ""ExpiresAt"" timestamp with time zone NOT NULL, ""UsedAt"" timestamp with time zone, ""CreatedAt"" timestamp with time zone NOT NULL, CONSTRAINT ""PK_PasswordResetTokens"" PRIMARY KEY (""Id""), CONSTRAINT ""FK_PasswordResetTokens_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE)");
                await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_PasswordResetTokens_ExpiresAt"" ON ""PasswordResetTokens"" (""ExpiresAt"")");
                await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_PasswordResetTokens_UserId"" ON ""PasswordResetTokens"" (""UserId"")");
            }
            catch (Exception ex) { logger.LogDebug(ex, "PasswordResetTokens repair skipped"); }
            await DbInitializer.SeedAsync(db);
        }

        var now = DateTime.UtcNow;
        var expiredRefresh = 0;
        var expiredReset = 0;
        var expiredEmailVerify = 0;
        var expiredEmailOtp = 0;
        try { expiredRefresh = await db.RefreshTokens.Where(r => r.ExpiresAt < now || r.RevokedAt != null).ExecuteDeleteAsync(); } catch (Exception ex) { logger.LogDebug(ex, "RefreshTokens cleanup skipped"); }
        try { expiredReset = await db.PasswordResetTokens.Where(p => p.ExpiresAt < now || p.UsedAt != null).ExecuteDeleteAsync(); } catch (Exception ex) { logger.LogDebug(ex, "PasswordResetTokens cleanup skipped"); }
        try { expiredEmailVerify = await db.EmailVerificationTokens.Where(e => e.ExpiresAt < now || e.UsedAt != null).ExecuteDeleteAsync(); } catch (Exception ex) { logger.LogDebug(ex, "EmailVerificationTokens cleanup skipped"); }
        try { expiredEmailOtp = await db.EmailOtpCodes.Where(e => e.ExpiresAt < now || e.UsedAt != null).ExecuteDeleteAsync(); } catch (Exception ex) { logger.LogDebug(ex, "EmailOtpCodes cleanup skipped"); }
        if (expiredRefresh > 0 || expiredReset > 0 || expiredEmailVerify > 0 || expiredEmailOtp > 0)
            logger.LogInformation("Cleaned tokens: R={R} P={P} EV={E} OTP={O}", expiredRefresh, expiredReset, expiredEmailVerify, expiredEmailOtp);
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "DB migration/seed failed (OK if DB not ready)");
    }
}

app.Run();

// WebApplicationFactory visibility
public partial class Program;
