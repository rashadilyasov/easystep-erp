using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Railway: PORT env variable üzrə dinlə (default 8080)
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// DbContext — Development-da SQLite, əks halda PostgreSQL (hosting üçün)
var conn = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Database=easystep_erp;Username=postgres;Password=postgres";
var useSqlite = conn.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase)
    || conn.EndsWith(".db", StringComparison.OrdinalIgnoreCase);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (useSqlite)
        options.UseSqlite(conn);
    else
        options.UseNpgsql(conn);
});

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AuditService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<IPaymentProvider, PayriffService>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();

// Controllers
builder.Services.AddControllers();

// JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? "easystep-erp-secret-key-min-32-chars!!";
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

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? new[] { "http://localhost:3000" })
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

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

// Migrations + seed + cleanup
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
            await DbInitializer.SeedAsync(db);
        }

        var now = DateTime.UtcNow;
        var expiredRefresh = await db.RefreshTokens.Where(r => r.ExpiresAt < now || r.RevokedAt != null).ExecuteDeleteAsync();
        var expiredReset = await db.PasswordResetTokens.Where(p => p.ExpiresAt < now || p.UsedAt != null).ExecuteDeleteAsync();
        var expiredEmailVerify = await db.EmailVerificationTokens.Where(e => e.ExpiresAt < now || e.UsedAt != null).ExecuteDeleteAsync();
        var expiredEmailOtp = await db.EmailOtpCodes.Where(e => e.ExpiresAt < now || e.UsedAt != null).ExecuteDeleteAsync();
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
