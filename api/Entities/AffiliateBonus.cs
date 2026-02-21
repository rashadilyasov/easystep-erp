namespace EasyStep.Erp.Api.Entities;

public enum AffiliateBonusStatus
{
    Pending = 0,
    Approved = 1,
    Paid = 2
}

/// <summary>Partnyor üçün aylıq bonus — ay ərzində 5+ müştəri ödəniş etməlidir.</summary>
public class AffiliateBonus
{
    public Guid Id { get; set; }
    public Guid AffiliateId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public int CustomerCount { get; set; }
    public decimal BonusAmount { get; set; }
    public AffiliateBonusStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? PaidAt { get; set; }

    public Affiliate Affiliate { get; set; } = null!;
}
