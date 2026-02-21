using EasyStep.Erp.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Device> Devices => Set<Device>();
    public DbSet<LicenseToken> LicenseTokens => Set<LicenseToken>();
    public DbSet<Release> Releases => Set<Release>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();
    public DbSet<EmailOtpCode> EmailOtpCodes => Set<EmailOtpCode>();
    public DbSet<SiteContent> SiteContents => Set<SiteContent>();
    public DbSet<Affiliate> Affiliates => Set<Affiliate>();
    public DbSet<PromoCode> PromoCodes => Set<PromoCode>();
    public DbSet<AffiliateCommission> AffiliateCommissions => Set<AffiliateCommission>();
    public DbSet<AffiliateBonus> AffiliateBonuses => Set<AffiliateBonus>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tenant>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Name);
            e.HasOne(x => x.PromoCode).WithMany().HasForeignKey(x => x.PromoCodeId);
        });

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => x.TenantId);
            e.HasOne(x => x.Tenant).WithMany(t => t.Users).HasForeignKey(x => x.TenantId);
        });

        modelBuilder.Entity<Plan>(e =>
        {
            e.HasKey(x => x.Id);
        });

        modelBuilder.Entity<Subscription>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasOne(x => x.Tenant).WithMany(t => t.Subscriptions).HasForeignKey(x => x.TenantId);
            e.HasOne(x => x.Plan).WithMany(p => p.Subscriptions).HasForeignKey(x => x.PlanId);
        });

        modelBuilder.Entity<Payment>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TransactionId);
            e.HasIndex(x => x.TenantId);
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId);
        });

        modelBuilder.Entity<Invoice>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId);
        });

        modelBuilder.Entity<Device>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.Fingerprint });
            e.HasOne(x => x.Tenant).WithMany(t => t.Devices).HasForeignKey(x => x.TenantId);
        });

        modelBuilder.Entity<LicenseToken>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Jti).IsUnique();
        });

        modelBuilder.Entity<Release>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Version);
        });

        modelBuilder.Entity<AuditLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.CreatedAt);
            e.HasIndex(x => x.ActorId);
        });

        modelBuilder.Entity<ContactMessage>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.CreatedAt);
        });

        modelBuilder.Entity<Ticket>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => x.CreatedAt);
            e.HasOne<Tenant>().WithMany().HasForeignKey(x => x.TenantId);
        });

        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.ExpiresAt);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
        });

        modelBuilder.Entity<PasswordResetToken>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.ExpiresAt);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
        });

        modelBuilder.Entity<EmailVerificationToken>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.ExpiresAt);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
        });

        modelBuilder.Entity<EmailOtpCode>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.ExpiresAt);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
        });

        modelBuilder.Entity<SiteContent>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Key).IsUnique();
        });

        modelBuilder.Entity<Affiliate>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId).IsUnique();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
        });

        modelBuilder.Entity<PromoCode>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Code).IsUnique();
            e.HasIndex(x => x.AffiliateId);
            e.HasIndex(x => x.TenantId);
            e.HasOne(x => x.Affiliate).WithMany().HasForeignKey(x => x.AffiliateId);
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId);
        });

        modelBuilder.Entity<AffiliateCommission>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.AffiliateId);
            e.HasIndex(x => x.PaymentId);
            e.HasOne(x => x.Affiliate).WithMany().HasForeignKey(x => x.AffiliateId);
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId);
            e.HasOne(x => x.Payment).WithMany().HasForeignKey(x => x.PaymentId);
        });

        modelBuilder.Entity<AffiliateBonus>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.AffiliateId);
            e.HasIndex(x => new { x.AffiliateId, x.Year, x.Month }).IsUnique();
            e.HasOne(x => x.Affiliate).WithMany().HasForeignKey(x => x.AffiliateId);
        });
    }
}
