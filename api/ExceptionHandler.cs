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

        var debug = context.Request.Headers["X-Debug"].FirstOrDefault() == "1";
        var msg = "Xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.";
        var body = new Dictionary<string, object?> { ["message"] = msg };
        if (debug) body["error"] = exception.Message;
        if (debug && exception.InnerException != null) body["inner"] = exception.InnerException.Message;
        await context.Response.WriteAsJsonAsync(body, ct);
        return true;
    }
}
