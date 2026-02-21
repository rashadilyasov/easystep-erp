namespace EasyStep.Erp.Api.Services;

public interface ITemplatedEmailService
{
    Task<bool> SendTemplatedAsync(string to, string templateKey, IReadOnlyDictionary<string, string> placeholders, CancellationToken ct = default);
}
