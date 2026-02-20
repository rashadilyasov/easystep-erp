namespace EasyStep.Erp.Api.Entities;

public class Tenant
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? TaxId { get; set; }
    public string ContactPerson { get; set; } = string.Empty;
    public string? Country { get; set; }
    public string? City { get; set; }
    public Guid? PromoCodeId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public PromoCode? PromoCode { get; set; }
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    public ICollection<Device> Devices { get; set; } = new List<Device>();
}
