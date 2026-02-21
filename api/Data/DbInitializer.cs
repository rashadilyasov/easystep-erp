using EasyStep.Erp.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Data;

public static class DbInitializer
{
    private static readonly Guid[] PlanIds =
    {
        Guid.Parse("a0000001-0001-0001-0001-000000000001"),
        Guid.Parse("a0000001-0001-0001-0001-000000000002"),
        Guid.Parse("a0000001-0001-0001-0001-000000000003"),
        Guid.Parse("a0000001-0001-0001-0001-000000000004"),
    };
    private static readonly Guid SystemTenantId = Guid.Parse("b0000000-0000-0000-0000-000000000001");
    public static readonly Guid AffiliatesTenantId = Guid.Parse("b0000000-0000-0000-0000-000000000002");
    private const string AdminEmail = "admin@easysteperp.com";

    public static async Task SeedAsync(ApplicationDbContext db, CancellationToken ct = default)
    {
        if (!await db.Users.AnyAsync(u => u.Email == AdminEmail, ct))
        {
            if (!await db.Tenants.AnyAsync(t => t.Id == SystemTenantId, ct))
            {
                db.Tenants.Add(new Tenant
                {
                    Id = SystemTenantId,
                    Name = "Easy Step ERP System",
                    ContactPerson = "Admin",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                });
            }
            db.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                TenantId = SystemTenantId,
                Email = AdminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!", 12),
                Role = UserRole.SuperAdmin,
                EmailVerified = true,
                TwoFactorEnabled = false,
                CreatedAt = DateTime.UtcNow,
            });
        }

        if (!await db.Tenants.AnyAsync(t => t.Id == AffiliatesTenantId, ct))
        {
            db.Tenants.Add(new Tenant
            {
                Id = AffiliatesTenantId,
                Name = "Affiliates",
                ContactPerson = "Affiliate",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });
        }

        if (await db.Plans.AnyAsync(ct))
        {
            await db.SaveChangesAsync(ct);
            return;
        }

        var utc = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var plans = new[]
        {
            new Plan { Id = PlanIds[0], Name = "Başla 1 ay", DurationMonths = 1, Price = 119, Currency = "AZN", IsActive = true, CreatedAt = utc },
            new Plan { Id = PlanIds[1], Name = "Standart 3 ay", DurationMonths = 3, Price = 329, Currency = "AZN", IsActive = true, CreatedAt = utc },
            new Plan { Id = PlanIds[2], Name = "İnkişaf 6 ay", DurationMonths = 6, Price = 599, Currency = "AZN", IsActive = true, CreatedAt = utc },
            new Plan { Id = PlanIds[3], Name = "Əla 12 ay", DurationMonths = 12, Price = 999, Currency = "AZN", IsActive = true, CreatedAt = utc },
        };
        db.Plans.AddRange(plans);

        if (!await db.Releases.AnyAsync(ct))
        {
            var now = DateTime.UtcNow;
            db.Releases.AddRange(
                new Release { Id = Guid.NewGuid(), Version = "1.2.0", FileUrl = "/releases/EasyStep-ERP-1.2.0.exe", Sha256 = "a1b2c3d4e5f6", Notes = "Yeni modullar əlavə edildi\nPerformans təkmilləşdirmələri\nBug düzəlişləri", IsLatest = true, PublishedAt = now },
                new Release { Id = Guid.NewGuid(), Version = "1.1.0", FileUrl = "/releases/EasyStep-ERP-1.1.0.exe", Sha256 = null, Notes = null, IsLatest = false, PublishedAt = now.AddDays(-45) }
            );
        }

        await db.SaveChangesAsync(ct);
    }

    /// <summary>Köhnə qiymətləri (49,135,240,420) yeni kanonik qiymətlərə (119,329,599,999) uyğunlaşdırır.</summary>
    public static async Task MigratePlanPricesAsync(ApplicationDbContext db, CancellationToken ct = default)
    {
        var p12 = await db.Plans.FirstOrDefaultAsync(p => p.DurationMonths == 12, ct);
        if (p12 == null || p12.Price != 420) return;
        var updates = new[] { (1, 119m, "Başla 1 ay"), (3, 329m, "Standart 3 ay"), (6, 599m, "İnkişaf 6 ay"), (12, 999m, "Əla 12 ay") };
        foreach (var (months, price, name) in updates)
        {
            var p = await db.Plans.FirstOrDefaultAsync(x => x.DurationMonths == months, ct);
            if (p != null) { p.Price = price; p.Name = name; }
        }
        await db.SaveChangesAsync(ct);
    }
}
