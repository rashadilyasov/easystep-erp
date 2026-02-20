namespace EasyStep.Erp.Api.Entities;

public enum AffiliateCommissionStatus
{
    Pending = 0,
    Approved = 1,
    Paid = 2
}

public class AffiliateCommission
{
    public Guid Id { get; set; }
    public Guid AffiliateId { get; set; }
    public Guid TenantId { get; set; }
    public Guid PaymentId { get; set; }
    public decimal Amount { get; set; }
    public decimal PaymentAmount { get; set; }
    public decimal CommissionPercent { get; set; }
    public AffiliateCommissionStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? PaidAt { get; set; }

    public Affiliate Affiliate { get; set; } = null!;
    public Tenant Tenant { get; set; } = null!;
    public Payment Payment { get; set; } = null!;
}
