namespace EasyStep.Erp.Api.Entities;

/// <summary>Plan — qiymət və müddətin tək mənbəyi. Admin-də dəyişəndə bütün hesablamalar (checkout, billing, pricing) avtomatik yenilənir.</summary>
public class Plan
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DurationMonths { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "AZN";
    public int? MaxDevices { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
}
