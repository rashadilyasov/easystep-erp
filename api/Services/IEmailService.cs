namespace EasyStep.Erp.Api.Services;

public interface IEmailService
{
    Task<bool> SendAsync(string to, string subject, string htmlBody, string? from = null, CancellationToken ct = default);
}
