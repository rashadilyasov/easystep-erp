namespace EasyStep.Erp.Api.Entities;

public class Affiliate
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public decimal BalanceTotal { get; set; }  // Total paid out
    public decimal BalancePending { get; set; } // Pending + Approved, not yet paid
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User User { get; set; } = null!;
}
