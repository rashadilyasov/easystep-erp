using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace EasyStep.Erp.Api.Tests;

public class LicenseValidationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public LicenseValidationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Validate_ReturnsOk_WithStatus()
    {
        var response = await _client.PostAsJsonAsync("/api/license/validate", new
        {
            licenseKey = (string?)null,
            tenantId = (Guid?)null,
            deviceFingerprint = "test-fp-123"
        });

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<ValidateResponse>();
        Assert.NotNull(body);
        Assert.Equal("Active", body.Status);
    }
}

public record ValidateResponse(string Status, Guid TenantId, DateTime ExpiresAt, DateTime OfflineGraceUntil, string EnforceMode);
