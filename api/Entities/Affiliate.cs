namespace EasyStep.Erp.Api.Entities;

public class Affiliate
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public bool IsApproved { get; set; }
    public decimal BalanceTotal { get; set; }
    public decimal BalancePending { get; set; }
    public decimal BalanceBonus { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User User { get; set; } = null!;
}
