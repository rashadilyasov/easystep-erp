namespace EasyStep.Erp.Api.Entities;

public enum PaymentStatus
{
    Pending = 0,
    Succeeded = 1,
    Failed = 2,
    Refunded = 3,
    Cancelled = 4
}

public class Payment
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? PlanId { get; set; }
    public string Provider { get; set; } = "Payriff";
    public string? TransactionId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "AZN";
    public PaymentStatus Status { get; set; }
    public string? RawEventRef { get; set; }
    public DateTime CreatedAt { get; set; }

    public Tenant Tenant { get; set; } = null!;
}
