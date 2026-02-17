using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace EasyStep.Erp.Api.Tests;

public class PaymentWebhookTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public PaymentWebhookTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PayriffWebhook_AcceptsPost()
    {
        var response = await _client.PostAsync("/api/billing/webhook/payriff",
            new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));

        // 200 or 400 (signature fail) - endpoint exists
        Assert.True(response.IsSuccessStatusCode || response.StatusCode == System.Net.HttpStatusCode.BadRequest);
    }
}
