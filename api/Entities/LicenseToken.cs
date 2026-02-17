namespace EasyStep.Erp.Api.Entities;

public class LicenseToken
{
    public Guid Id { get; set; }
    public Guid DeviceId { get; set; }
    public string Jti { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
}
