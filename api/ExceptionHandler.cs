using Microsoft.AspNetCore.Diagnostics;

namespace EasyStep.Erp.Api;

public class JsonExceptionHandler : IExceptionHandler
{
    private readonly ILogger<JsonExceptionHandler> _logger;

    public JsonExceptionHandler(ILogger<JsonExceptionHandler> logger) => _logger = logger;

    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken ct)
    {
        _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);

        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";

        var msg = "Daxil olma zamanı xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.";
        await context.Response.WriteAsJsonAsync(new { message = msg }, ct);
        return true;
    }
}
