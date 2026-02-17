namespace EasyStep.Erp.Api.Entities;

public enum UserRole
{
    Visitor = 0,
    CustomerUser = 1,
    CustomerAdmin = 2,
    SuperAdmin = 3
}

public class User
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool EmailVerified { get; set; }
    public bool TwoFactorEnabled { get; set; }
    public string? TwoFactorSecret { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }

    public Tenant Tenant { get; set; } = null!;
}
