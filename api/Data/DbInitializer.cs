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
            new Plan { Id = PlanIds[0], Name = "Pro 1 ay", DurationMonths = 1, Price = 49, Currency = "AZN", IsActive = true, CreatedAt = utc },
            new Plan { Id = PlanIds[1], Name = "Pro 3 ay", DurationMonths = 3, Price = 135, Currency = "AZN", IsActive = true, CreatedAt = utc },
            new Plan { Id = PlanIds[2], Name = "Pro 6 ay", DurationMonths = 6, Price = 240, Currency = "AZN", IsActive = true, CreatedAt = utc },
            new Plan { Id = PlanIds[3], Name = "Pro 12 ay", DurationMonths = 12, Price = 420, Currency = "AZN", IsActive = true, CreatedAt = utc },
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
}
