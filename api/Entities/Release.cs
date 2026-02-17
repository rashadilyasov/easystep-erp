namespace EasyStep.Erp.Api.Entities;

public class Release
{
    public Guid Id { get; set; }
    public string Version { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string? Sha256 { get; set; }
    public string? Notes { get; set; }
    public bool IsLatest { get; set; }
    public DateTime PublishedAt { get; set; }
}
