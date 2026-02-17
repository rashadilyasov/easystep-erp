using System.Net.Http.Json;

namespace EasyStep.Erp.Api.Services;

public class PayriffService : IPaymentProvider
{
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;

    private const string BaseUrl = "https://api.payriff.com/api/v3";

    public string Name => "Payriff";

    public PayriffService(IHttpClientFactory http, IConfiguration config)
    {
        _http = http;
        _config = config;
    }

    public async Task<CheckoutResult?> CreateOrderAsync(
        decimal amount,
        string currency,
        string description,
        string callbackUrl,
        Dictionary<string, string>? metadata = null,
        CancellationToken ct = default)
    {
        var secret = _config["Payriff:SecretKey"];
        if (string.IsNullOrEmpty(secret))
            return null;

        var body = new
        {
            amount,
            language = "AZ",
            currency,
            description,
            callbackUrl,
            cardSave = false,
            operation = "PURCHASE",
            metadata = metadata ?? new Dictionary<string, string>(),
        };

        var client = _http.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", secret);

        var res = await client.PostAsJsonAsync($"{BaseUrl}/orders", body, ct);
        if (!res.IsSuccessStatusCode)
            return null;

        var json = await res.Content.ReadFromJsonAsync<PayriffOrderResponse>(ct);
        if (json?.Payload == null || json.Code != "00000")
            return null;

        return new CheckoutResult(
            json.Payload.OrderId ?? "",
            json.Payload.PaymentUrl ?? "",
            json.Payload.TransactionId?.ToString());
    }
}

internal class PayriffOrderResponse
{
    public string Code { get; set; } = "";
    public PayriffOrderPayload? Payload { get; set; }
}

internal class PayriffOrderPayload
{
    public string? OrderId { get; set; }
    public string? PaymentUrl { get; set; }
    public long? TransactionId { get; set; }
}
