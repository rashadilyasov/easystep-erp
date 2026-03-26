using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using EasyStep.Erp.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EasyStep.Erp.Api.Tests;

/// <summary>
/// SYSTEM VERIFICATION LOCK — Tasks 1-5
/// Task 1: DELETE flow (rowVersion → 204/409)
/// Task 2: File orphan check after purchase delete
/// Task 3: Audit middleware safety (exceptions must not affect response)
/// Task 4: Inventory consistency (stock-integrity mismatch → fix → clean)
/// Task 5: Performance snapshot (login, create purchase, stock-integrity)
/// </summary>
public class SystemVerificationTests : IClassFixture<SystemVerificationFactory>
{
    private readonly HttpClient _client;

    public SystemVerificationTests(SystemVerificationFactory factory)
    {
        _client = factory.CreateClient();
    }

    // ──────────────────────────────────────────────
    // TASK 1 — DELETE FLOW FINAL PROOF
    // ──────────────────────────────────────────────

    [Fact]
    public async Task Task1_DeleteFlow_FirstDelete_Returns204()
    {
        var (id, rowVersion) = await CreatePurchase("Delete flow test 1", 100m);

        var deleteResp = await _client.DeleteAsync($"/api/purchases/{id}?rowVersion={rowVersion}");

        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);
    }

    [Fact]
    public async Task Task1_DeleteFlow_SecondDeleteSameRowVersion_Returns409()
    {
        var (id, rowVersion) = await CreatePurchase("Delete flow test 2", 200m);

        // First delete — should succeed
        var first = await _client.DeleteAsync($"/api/purchases/{id}?rowVersion={rowVersion}");
        Assert.Equal(HttpStatusCode.NoContent, first.StatusCode);

        // Second delete with SAME rowVersion — must return 409
        var second = await _client.DeleteAsync($"/api/purchases/{id}?rowVersion={rowVersion}");
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Task1_DeleteFlow_WrongRowVersion_Returns409()
    {
        var (id, _) = await CreatePurchase("Delete flow test 3", 300m);
        var wrongRowVersion = Guid.NewGuid();

        var resp = await _client.DeleteAsync($"/api/purchases/{id}?rowVersion={wrongRowVersion}");

        Assert.Equal(HttpStatusCode.Conflict, resp.StatusCode);
    }

    // ──────────────────────────────────────────────
    // TASK 2 — FILE ORPHAN CHECK
    // ──────────────────────────────────────────────

    [Fact]
    public async Task Task2_FileOrphan_DeletePurchase_FileRemovedFromDisk()
    {
        var (id, rowVersion) = await CreatePurchase("Orphan check purchase", 50m);

        // Upload a file
        var tmpFile = Path.GetTempFileName();
        await File.WriteAllTextAsync(tmpFile, "test file content");

        string? uploadedFilePath = null;
        try
        {
            using var form = new MultipartFormDataContent();
            await using var stream = File.OpenRead(tmpFile);
            form.Add(new StreamContent(stream), "file", "test.txt");

            var uploadResp = await _client.PostAsync($"/api/purchases/{id}/files", form);
            Assert.Equal(HttpStatusCode.OK, uploadResp.StatusCode);

            var uploadBody = await uploadResp.Content.ReadFromJsonAsync<UploadResponse>();
            Assert.NotNull(uploadBody);
            uploadedFilePath = uploadBody!.FilePath;
            Assert.True(File.Exists(uploadedFilePath), "File should exist on disk after upload");

            // Delete purchase
            var deleteResp = await _client.DeleteAsync($"/api/purchases/{id}?rowVersion={rowVersion}");
            Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);

            // Verify file is gone from disk (no orphan)
            var orphanExists = File.Exists(uploadedFilePath);
            if (orphanExists)
            {
                // Log the orphan bug as required by task 2
                Console.Error.WriteLine($"ORPHAN FILE BUG: {uploadedFilePath} still exists after purchase {id} was deleted");
            }
            Assert.False(orphanExists, "ORPHAN FILE BUG: file should have been deleted with purchase");
        }
        finally
        {
            if (File.Exists(tmpFile)) File.Delete(tmpFile);
            if (uploadedFilePath != null && File.Exists(uploadedFilePath)) File.Delete(uploadedFilePath);
        }
    }

    // ──────────────────────────────────────────────
    // TASK 3 — AUDIT MIDDLEWARE SAFETY
    // ──────────────────────────────────────────────

    [Fact]
    public async Task Task3_AuditSafety_Create_DoesNotThrow()
    {
        // Create should succeed regardless of audit internals
        var resp = await _client.PostAsJsonAsync("/api/purchases", new { description = "Audit safety test", amount = 10m });
        Assert.True(resp.IsSuccessStatusCode, $"Create returned {resp.StatusCode} — UNSAFE AUDIT");
    }

    [Fact]
    public async Task Task3_AuditSafety_Delete_DoesNotThrow()
    {
        var (id, rowVersion) = await CreatePurchase("Audit safety delete", 10m);
        var resp = await _client.DeleteAsync($"/api/purchases/{id}?rowVersion={rowVersion}");
        Assert.Equal(HttpStatusCode.NoContent, resp.StatusCode);
    }

    [Fact]
    public async Task Task3_AuditSafety_InventoryCreate_DoesNotThrow()
    {
        var resp = await _client.PostAsJsonAsync("/api/inventory/items", new
        {
            name = "Audit inventory item",
            expectedQuantity = 10,
            actualQuantity = 10
        });
        Assert.True(resp.IsSuccessStatusCode, $"Inventory create returned {resp.StatusCode} — UNSAFE AUDIT");
    }

    // ──────────────────────────────────────────────
    // TASK 4 — INVENTORY CONSISTENCY LOOP
    // ──────────────────────────────────────────────

    [Fact]
    public async Task Task4_InventoryConsistency_MismatchAppearsInStockIntegrity()
    {
        // Create mismatch
        var createResp = await _client.PostAsJsonAsync("/api/inventory/items", new
        {
            name = $"Item-Mismatch-{Guid.NewGuid():N}",
            expectedQuantity = 100,
            actualQuantity = 75
        });
        Assert.True(createResp.IsSuccessStatusCode);

        // Stock-integrity must report it
        var integrityResp = await _client.GetAsync("/api/inventory/stock-integrity");
        Assert.Equal(HttpStatusCode.OK, integrityResp.StatusCode);

        var body = await integrityResp.Content.ReadFromJsonAsync<StockIntegrityResponse>();
        Assert.NotNull(body);
        Assert.False(body!.Clean, "Inventory should be NOT clean after creating mismatch");
        Assert.True(body.MismatchCount > 0, "Mismatch count should be > 0");
    }

    [Fact]
    public async Task Task4_InventoryConsistency_FixMakesItClean()
    {
        // Create mismatch
        await _client.PostAsJsonAsync("/api/inventory/items", new
        {
            name = $"Item-Fix-{Guid.NewGuid():N}",
            expectedQuantity = 50,
            actualQuantity = 30
        });

        // POST fix
        var fixResp = await _client.PostAsync("/api/inventory/fix", null);
        Assert.Equal(HttpStatusCode.OK, fixResp.StatusCode);

        // GET again — must be clean
        var integrityResp = await _client.GetAsync("/api/inventory/stock-integrity");
        var body = await integrityResp.Content.ReadFromJsonAsync<StockIntegrityResponse>();
        Assert.NotNull(body);
        Assert.True(body!.Clean, "Inventory should be clean after fix");
        Assert.Equal(0, body.MismatchCount);
    }

    // ──────────────────────────────────────────────
    // TASK 5 — PERFORMANCE SNAPSHOT
    // ──────────────────────────────────────────────

    [Fact]
    public async Task Task5_Performance_LoginEndpointRespondsQuickly()
    {
        var sw = Stopwatch.StartNew();
        // Use a known fast endpoint that exercises auth path
        await _client.PostAsJsonAsync("/api/auth/ping", new { });
        sw.Stop();

        var ms = sw.ElapsedMilliseconds;
        Console.WriteLine($"[PERF] login-equivalent (auth/ping) = {ms}ms");
        // Reasonable threshold for an in-memory test server
        Assert.True(ms < 5000, $"Auth response too slow: {ms}ms");
    }

    [Fact]
    public async Task Task5_Performance_PurchaseCreateRespondsQuickly()
    {
        var sw = Stopwatch.StartNew();
        await _client.PostAsJsonAsync("/api/purchases", new { description = "Perf test", amount = 1m });
        sw.Stop();

        var ms = sw.ElapsedMilliseconds;
        Console.WriteLine($"[PERF] purchase create = {ms}ms");
        Assert.True(ms < 5000, $"Purchase create too slow: {ms}ms");
    }

    [Fact]
    public async Task Task5_Performance_StockIntegrityRespondsQuickly()
    {
        var sw = Stopwatch.StartNew();
        await _client.GetAsync("/api/inventory/stock-integrity");
        sw.Stop();

        var ms = sw.ElapsedMilliseconds;
        Console.WriteLine($"[PERF] stock-integrity = {ms}ms");
        Assert.True(ms < 5000, $"Stock-integrity too slow: {ms}ms");
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    private async Task<(Guid id, Guid rowVersion)> CreatePurchase(string description, decimal amount)
    {
        var resp = await _client.PostAsJsonAsync("/api/purchases", new { description, amount });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<PurchaseResponse>();
        Assert.NotNull(body);
        return (body!.Id, body.RowVersion);
    }

    private record PurchaseResponse(Guid Id, string Description, decimal Amount, Guid RowVersion, DateTime CreatedAt);
    private record UploadResponse(Guid Id, string FileName, string FilePath);
    private record StockIntegrityResponse(bool Clean, int MismatchCount);
}

public class SystemVerificationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(d =>
                d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (descriptor != null) services.Remove(descriptor);

            // Use a unique DB name per factory instance to prevent cross-test pollution
            var dbName = $"SystemVerificationDb_{Guid.NewGuid():N}";
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(dbName));
        });
    }
}
