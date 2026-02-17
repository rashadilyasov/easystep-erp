namespace EasyStep.Erp.Api.Services;

public interface IPaymentProvider
{
    string Name { get; }
    Task<CheckoutResult?> CreateOrderAsync(
        decimal amount,
        string currency,
        string description,
        string callbackUrl,
        Dictionary<string, string>? metadata = null,
        CancellationToken ct = default);
}

public record CheckoutResult(string OrderId, string PaymentUrl, string? TransactionId);
