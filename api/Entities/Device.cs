namespace EasyStep.Erp.Api.Entities;

public enum DeviceStatus
{
    Active = 0,
    Deactivated = 1
}

public class Device
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public string Fingerprint { get; set; } = string.Empty;
    public string? DeviceName { get; set; }
    public DeviceStatus Status { get; set; } = DeviceStatus.Active;
    public DateTime LastSeenAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Tenant Tenant { get; set; } = null!;
}
