using System.ComponentModel.DataAnnotations;

namespace EasyStep.Erp.Api.Entities;

public enum PromoCodeStatus
{
    Available = 0,
    Used = 1
}

public class PromoCode
{
    public Guid Id { get; set; }
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;
    public Guid AffiliateId { get; set; }
    public Guid? TenantId { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal CommissionPercent { get; set; }
    public PromoCodeStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UsedAt { get; set; }

    public Affiliate Affiliate { get; set; } = null!;
    public Tenant? Tenant { get; set; }
}
