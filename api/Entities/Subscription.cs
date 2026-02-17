namespace EasyStep.Erp.Api.Entities;

public enum SubscriptionStatus
{
    Pending = 0,
    Active = 1,
    PastDue = 2,
    Expired = 3,
    Cancelled = 4,
    Suspended = 5
}

public class Subscription
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid PlanId { get; set; }
    public SubscriptionStatus Status { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool AutoRenew { get; set; } = true;
    public DateTime? CanceledAt { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public Plan Plan { get; set; } = null!;
}
