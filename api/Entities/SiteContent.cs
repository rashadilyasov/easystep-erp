namespace EasyStep.Erp.Api.Entities;

public class SiteContent
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty; // JSON
    public DateTime UpdatedAt { get; set; }
}
