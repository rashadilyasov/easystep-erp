using System.ComponentModel.DataAnnotations;

namespace EasyStep.Erp.Api.Entities;

/// <summary>0=Seçilməyib, 1=Bank, 2=Payriff, 3=Kart/Digər</summary>
public enum CommissionReceiveMethod
{
    NotSet = 0,
    Bank = 1,
    Payriff = 2,
    CardOrOther = 3,
}

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

    /// <summary>Bank hesabı - IBAN</summary>
    [MaxLength(50)]
    public string? BankIban { get; set; }
    [MaxLength(100)]
    public string? BankName { get; set; }
    [MaxLength(200)]
    public string? BankAccountHolder { get; set; }
    /// <summary>Payriff: kart son 4 rəqəm, telefon və s. (tam kart saxlanmır)</summary>
    [MaxLength(200)]
    public string? PayriffInfo { get; set; }
    public CommissionReceiveMethod CommissionReceiveMethod { get; set; }
    /// <summary>Komissiya hansı hesaba ödənilsin - əlavə qeyd</summary>
    [MaxLength(500)]
    public string? CommissionAccountNote { get; set; }

    public User User { get; set; } = null!;
}
