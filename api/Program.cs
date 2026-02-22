using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Services;
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
builder.Services.AddScoped<AffiliateService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<AffiliateAbuseService>();
builder.Services.AddHostedService<AffiliateBonusBackgroundService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<IPaymentProvider, PayriffService>();
builder.Services.AddScoped<EmailSettingsService>();
builder.Services.AddScoped<EmailTemplateService>();
builder.Services.AddScoped<IEmailService, ConfigurableSmtpEmailService>();
builder.Services.AddScoped<ITemplatedEmailService, TemplatedEmailService>();

// Controllers
builder.Services.AddControllers();

// JWT — Jwt:Key (Jwt__Key) və Jwt_Key formatlarını dəstəkləyir
var jwtKey = builder.Configuration["Jwt:Key"] ?? builder.Configuration["Jwt_Key"] ?? "";
var defaultKey = "easystep-erp-secret-key-min-32-chars!!";
if (string.IsNullOrEmpty(jwtKey) || jwtKey.Length < 32) jwtKey = defaultKey;
if (builder.Environment.IsProduction() && jwtKey == defaultKey)
    throw new InvalidOperationException("Production-də Jwt__Key təyin edilməlidir (min 32 simvol). RAILWAY-ENV.md-ə baxın.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            NameClaimType = System.Security.Claims.ClaimTypes.NameIdentifier,
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", p => p.RequireRole("SuperAdmin"));
    options.AddPolicy("AffiliateOnly", p => p.RequireRole("Affiliate"));
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
    options.AddFixedWindowLimiter("contact", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 3;
    });
    options.AddFixedWindowLimiter("support", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(5);
        opt.PermitLimit = 20;
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
    if (origin.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && !origin.StartsWith("http://localhost") && !origin.StartsWith("http://127.0.0.1"))
        return false;
    if (origin.Equals("https://easysteperp.com", StringComparison.OrdinalIgnoreCase)) return true;
    if (origin.Equals("https://www.easysteperp.com", StringComparison.OrdinalIgnoreCase)) return true;
    if (origin.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase)) return true;
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

// Exception handler — JSON qaytarır, xətanı loglayır
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var ex = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>()?.Error
            ?? context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
        if (ex != null)
        {
            var logger = context.RequestServices.GetService<ILogger<Program>>();
            logger?.LogError(ex, "Unhandled exception: {Path}", context.Request.Path);
        }
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = "Xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin." });
    });
});

// Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    if (!app.Environment.IsDevelopment())
        context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
    await next();
});

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Json(new { service = "Easy Step ERP API", status = "ok", docs = "/swagger" }));
app.MapControllers();

// Migrations + seed — FOREGROUND (login işləməzdən əvvəl DB hazır olmalıdır)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        if (useSqlite)
        {
            await db.Database.EnsureCreatedAsync();
            await db.Database.ExecuteSqlRawAsync(
                "CREATE TABLE IF NOT EXISTS SiteContents (Id TEXT PRIMARY KEY, [Key] TEXT UNIQUE NOT NULL, Value TEXT NOT NULL, UpdatedAt TEXT NOT NULL)");
            try
            {
                await db.Database.ExecuteSqlRawAsync("ALTER TABLE Tenants ADD COLUMN PromoCodeId TEXT");
            }
            catch { }
            try
            {
                await db.Database.ExecuteSqlRawAsync("ALTER TABLE Payments ADD COLUMN DiscountAmount REAL DEFAULT 0");
            }
            catch { }
            try
            {
                await db.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS Affiliates (Id TEXT PRIMARY KEY, UserId TEXT NOT NULL, BalanceTotal REAL NOT NULL, BalancePending REAL NOT NULL, CreatedAt TEXT NOT NULL, UpdatedAt TEXT NOT NULL, FOREIGN KEY (UserId) REFERENCES Users(Id))");
                try { await db.Database.ExecuteSqlRawAsync("ALTER TABLE Affiliates ADD COLUMN IsApproved INTEGER DEFAULT 1"); } catch { } /* 1=approved for existing partners */
                try { await db.Database.ExecuteSqlRawAsync("ALTER TABLE Affiliates ADD COLUMN BalanceBonus REAL DEFAULT 0"); } catch { }
                try { await db.Database.ExecuteSqlRawAsync("ALTER TABLE PromoCodes ADD COLUMN DiscountValidUntil TEXT"); } catch { }
                await db.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS PromoCodes (Id TEXT PRIMARY KEY, Code TEXT UNIQUE NOT NULL, AffiliateId TEXT NOT NULL, TenantId TEXT, DiscountPercent REAL NOT NULL, CommissionPercent REAL NOT NULL, Status INTEGER NOT NULL, CreatedAt TEXT NOT NULL, UsedAt TEXT, FOREIGN KEY (AffiliateId) REFERENCES Affiliates(Id), FOREIGN KEY (TenantId) REFERENCES Tenants(Id))");
                await db.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS AffiliateCommissions (Id TEXT PRIMARY KEY, AffiliateId TEXT NOT NULL, TenantId TEXT NOT NULL, PaymentId TEXT NOT NULL, Amount REAL NOT NULL, PaymentAmount REAL NOT NULL, CommissionPercent REAL NOT NULL, Status INTEGER NOT NULL, CreatedAt TEXT NOT NULL, ApprovedAt TEXT, PaidAt TEXT, FOREIGN KEY (AffiliateId) REFERENCES Affiliates(Id), FOREIGN KEY (TenantId) REFERENCES Tenants(Id), FOREIGN KEY (PaymentId) REFERENCES Payments(Id))");
                await db.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS IX_Affiliates_UserId ON Affiliates(UserId)");
                await db.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS IX_PromoCodes_Code ON PromoCodes(Code)");
                await db.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS AffiliateBonuses (Id TEXT PRIMARY KEY, AffiliateId TEXT NOT NULL, Year INTEGER NOT NULL, Month INTEGER NOT NULL, CustomerCount INTEGER NOT NULL, BonusAmount REAL NOT NULL, Status INTEGER NOT NULL, CreatedAt TEXT NOT NULL, ApprovedAt TEXT, PaidAt TEXT, FOREIGN KEY (AffiliateId) REFERENCES Affiliates(Id))");
                await db.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS IX_AffiliateBonuses_Affiliate_Year_Month ON AffiliateBonuses(AffiliateId, Year, Month)");
            }
            catch { }
            await DbInitializer.SeedAsync(db);
            await DbInitializer.MigratePlanPricesAsync(db);
            var emailTemplatesSqlite = scope.ServiceProvider.GetRequiredService<EmailTemplateService>();
            await emailTemplatesSqlite.EnsureDefaultTemplatesAsync(ct: default);
        }
        else
        {
            await db.Database.MigrateAsync();
            try { await db.Database.ExecuteSqlRawAsync(@"CREATE TABLE IF NOT EXISTS ""RefreshTokens"" (""Id"" uuid NOT NULL, ""UserId"" uuid NOT NULL, ""TokenHash"" text NOT NULL, ""ExpiresAt"" timestamp with time zone NOT NULL, ""RevokedAt"" timestamp with time zone, ""CreatedAt"" timestamp with time zone NOT NULL, CONSTRAINT ""PK_RefreshTokens"" PRIMARY KEY (""Id""), CONSTRAINT ""FK_RefreshTokens_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE)"); } catch { }
            try { await db.Database.ExecuteSqlRawAsync(@"CREATE TABLE IF NOT EXISTS ""PasswordResetTokens"" (""Id"" uuid NOT NULL, ""UserId"" uuid NOT NULL, ""TokenHash"" text NOT NULL, ""ExpiresAt"" timestamp with time zone NOT NULL, ""UsedAt"" timestamp with time zone, ""CreatedAt"" timestamp with time zone NOT NULL, CONSTRAINT ""PK_PasswordResetTokens"" PRIMARY KEY (""Id""), CONSTRAINT ""FK_PasswordResetTokens_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE)"); } catch { }
            try { await db.Database.ExecuteSqlRawAsync(@"DO $$ BEGIN ALTER TABLE ""Tenants"" ADD COLUMN ""PromoCodeId"" uuid NULL; EXCEPTION WHEN duplicate_column THEN NULL; END $$"); } catch { }
            try { await db.Database.ExecuteSqlRawAsync(@"DO $$ BEGIN ALTER TABLE tenants ADD COLUMN ""PromoCodeId"" uuid NULL; EXCEPTION WHEN duplicate_column OR undefined_table THEN NULL; END $$"); } catch { }
            try { await db.Database.ExecuteSqlRawAsync(@"DO $$ BEGIN ALTER TABLE ""Payments"" ADD COLUMN ""DiscountAmount"" numeric(18,2) NOT NULL DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END $$"); } catch { }
            try { await db.Database.ExecuteSqlRawAsync(@"DO $$ BEGIN ALTER TABLE payments ADD COLUMN ""DiscountAmount"" numeric(18,2) NOT NULL DEFAULT 0; EXCEPTION WHEN duplicate_column OR undefined_table THEN NULL; END $$"); } catch { }
            try
            {
                await db.Database.ExecuteSqlRawAsync(@"CREATE TABLE IF NOT EXISTS ""EmailVerificationTokens"" (""Id"" uuid NOT NULL, ""UserId"" uuid NOT NULL, ""TokenHash"" text NOT NULL, ""ExpiresAt"" timestamp with time zone NOT NULL, ""UsedAt"" timestamp with time zone, ""CreatedAt"" timestamp with time zone NOT NULL, CONSTRAINT ""PK_EmailVerificationTokens"" PRIMARY KEY (""Id""), CONSTRAINT ""FK_EmailVerificationTokens_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE)");
                await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_EmailVerificationTokens_UserId"" ON ""EmailVerificationTokens"" (""UserId"")");
                await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_EmailVerificationTokens_ExpiresAt"" ON ""EmailVerificationTokens"" (""ExpiresAt"")");
            }
            catch { }
            try
            {
                await db.Database.ExecuteSqlRawAsync(@"CREATE TABLE IF NOT EXISTS ""Affiliates"" (""Id"" uuid NOT NULL, ""UserId"" uuid NOT NULL, ""IsApproved"" boolean NOT NULL DEFAULT false, ""BalanceTotal"" numeric(18,2) NOT NULL, ""BalancePending"" numeric(18,2) NOT NULL, ""BalanceBonus"" numeric(18,2) NOT NULL DEFAULT 0, ""CreatedAt"" timestamp with time zone NOT NULL, ""UpdatedAt"" timestamp with time zone NOT NULL, CONSTRAINT ""PK_Affiliates"" PRIMARY KEY (""Id""), CONSTRAINT ""FK_Affiliates_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE)");
                await db.Database.ExecuteSqlRawAsync(@"CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Affiliates_UserId"" ON ""Affiliates"" (""UserId"")");
                await db.Database.ExecuteSqlRawAsync(@"DO $$ BEGIN ALTER TABLE ""Affiliates"" ADD COLUMN ""IsApproved"" boolean NOT NULL DEFAULT true; EXCEPTION WHEN duplicate_column THEN NULL; END $$");
                await db.Database.ExecuteSqlRawAsync(@"DO $$ BEGIN ALTER TABLE ""Affiliates"" ADD COLUMN ""BalanceBonus"" numeric(18,2) NOT NULL DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END $$");
                await db.Database.ExecuteSqlRawAsync(@"CREATE TABLE IF NOT EXISTS ""PromoCodes"" (""Id"" uuid NOT NULL, ""Code"" character varying(50) NOT NULL, ""AffiliateId"" uuid NOT NULL, ""TenantId"" uuid NULL, ""DiscountPercent"" numeric(5,2) NOT NULL, ""CommissionPercent"" numeric(5,2) NOT NULL, ""Status"" integer NOT NULL, ""CreatedAt"" timestamp with time zone NOT NULL, ""UsedAt"" timestamp with time zone NULL, ""DiscountValidUntil"" timestamp with time zone NULL, CONSTRAINT ""PK_PromoCodes"" PRIMARY KEY (""Id""), CONSTRAINT ""FK_PromoCodes_Affiliates_AffiliateId"" FOREIGN KEY (""AffiliateId"") REFERENCES ""Affiliates"" (""Id"") ON DELETE CASCADE, CONSTRAINT ""FK_PromoCodes_Tenants_TenantId"" FOREIGN KEY (""TenantId"") REFERENCES ""Tenants"" (""Id"") ON DELETE SET NULL)");
                await db.Database.ExecuteSqlRawAsync(@"CREATE UNIQUE INDEX IF NOT EXISTS ""IX_PromoCodes_Code"" ON ""PromoCodes"" (""Code"")");
                await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_PromoCodes_AffiliateId"" ON ""PromoCodes"" (""AffiliateId"")");
                await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_PromoCodes_TenantId"" ON ""PromoCodes"" (""TenantId"")");
                await db.Database.ExecuteSqlRawAsync(@"DO $$ BEGIN ALTER TABLE ""PromoCodes"" ADD COLUMN ""DiscountValidUntil"" timestamp with time zone; EXCEPTION WHEN duplicate_column THEN NULL; END $$");
                await db.Database.ExecuteSqlRawAsync(@"CREATE TABLE IF NOT EXISTS ""AffiliateCommissions"" (""Id"" uuid NOT NULL, ""AffiliateId"" uuid NOT NULL, ""TenantId"" uuid NOT NULL, ""PaymentId"" uuid NOT NULL, ""Amount"" numeric(18,2) NOT NULL, ""PaymentAmount"" numeric(18,2) NOT NULL, ""CommissionPercent"" numeric(5,2) NOT NULL, ""Status"" integer NOT NULL, ""CreatedAt"" timestamp with time zone NOT NULL, ""ApprovedAt"" timestamp with time zone NULL, ""PaidAt"" timestamp with time zone NULL, CONSTRAINT ""PK_AffiliateCommissions"" PRIMARY KEY (""Id""), CONSTRAINT ""FK_AffiliateCommissions_Affiliates_AffiliateId"" FOREIGN KEY (""AffiliateId"") REFERENCES ""Affiliates"" (""Id"") ON DELETE CASCADE, CONSTRAINT ""FK_AffiliateCommissions_Tenants_TenantId"" FOREIGN KEY (""TenantId"") REFERENCES ""Tenants"" (""Id"") ON DELETE CASCADE, CONSTRAINT ""FK_AffiliateCommissions_Payments_PaymentId"" FOREIGN KEY (""PaymentId"") REFERENCES ""Payments"" (""Id"") ON DELETE CASCADE)");
                await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_AffiliateCommissions_AffiliateId"" ON ""AffiliateCommissions"" (""AffiliateId"")");
                await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_AffiliateCommissions_PaymentId"" ON ""AffiliateCommissions"" (""PaymentId"")");
                await db.Database.ExecuteSqlRawAsync(@"CREATE TABLE IF NOT EXISTS ""AffiliateBonuses"" (""Id"" uuid NOT NULL, ""AffiliateId"" uuid NOT NULL, ""Year"" integer NOT NULL, ""Month"" integer NOT NULL, ""CustomerCount"" integer NOT NULL, ""BonusAmount"" numeric(18,2) NOT NULL, ""Status"" integer NOT NULL, ""CreatedAt"" timestamp with time zone NOT NULL, ""ApprovedAt"" timestamp with time zone NULL, ""PaidAt"" timestamp with time zone NULL, CONSTRAINT ""PK_AffiliateBonuses"" PRIMARY KEY (""Id""), CONSTRAINT ""FK_AffiliateBonuses_Affiliates_AffiliateId"" FOREIGN KEY (""AffiliateId"") REFERENCES ""Affiliates"" (""Id"") ON DELETE CASCADE)");
                await db.Database.ExecuteSqlRawAsync(@"CREATE UNIQUE INDEX IF NOT EXISTS ""IX_AffiliateBonuses_Affiliate_Year_Month"" ON ""AffiliateBonuses"" (""AffiliateId"", ""Year"", ""Month"")");
                await db.Database.ExecuteSqlRawAsync(@"DO $$ BEGIN ALTER TABLE ""Tenants"" ADD COLUMN ""PromoCodeId"" uuid NULL; EXCEPTION WHEN duplicate_column THEN NULL; END $$");
                await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_Tenants_PromoCodeId"" ON ""Tenants"" (""PromoCodeId"")");
                try { await db.Database.ExecuteSqlRawAsync(@"DO $$ BEGIN ALTER TABLE ""Tenants"" ADD CONSTRAINT ""FK_Tenants_PromoCodes_PromoCodeId"" FOREIGN KEY (""PromoCodeId"") REFERENCES ""PromoCodes"" (""Id"") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$"); } catch { }
            }
            catch { }
            await DbInitializer.SeedAsync(db);
            await DbInitializer.MigratePlanPricesAsync(db);
            var emailTemplatesPg = scope.ServiceProvider.GetRequiredService<EmailTemplateService>();
            await emailTemplatesPg.EnsureDefaultTemplatesAsync(ct: default);
        }
        logger.LogInformation("DB migration and seed completed");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "DB migration/seed FAILED - login will not work");
        throw;
    }
}

app.Run();

// WebApplicationFactory visibility
public partial class Program;
