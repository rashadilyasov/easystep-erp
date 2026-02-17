namespace EasyStep.Erp.Api.Entities;

public class Invoice
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid PaymentId { get; set; }
    public string Number { get; set; } = string.Empty;
    public string? PdfUrl { get; set; }
    public DateTime IssuedAt { get; set; }

    public Tenant Tenant { get; set; } = null!;
}
