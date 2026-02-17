using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using EasyStep.Erp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyStep.Erp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BillingController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IPaymentProvider _payment;
    private readonly IConfiguration _config;
    private readonly Services.AuditService _audit;

    public BillingController(ApplicationDbContext db, IPaymentProvider payment, IConfiguration config, Services.AuditService audit)
    {
        _db = db;
        _payment = payment;
        _config = config;
        _audit = audit;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var tenantId = GetTenantId();
        if (tenantId == null)
            return Ok(DefaultBilling());

        var sub = await _db.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.TenantId == tenantId.Value && s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync(ct);

        var payments = await _db.Payments
            .Where(p => p.TenantId == tenantId.Value)
            .OrderByDescending(p => p.CreatedAt)
            .Take(50)
            .Select(p => new { p.Id, p.CreatedAt, p.Amount, p.Currency, p.Status, p.TransactionId })
            .ToListAsync(ct);

        var paymentIds = payments.Select(p => p.Id).ToList();
        var invoices = await _db.Invoices
            .Where(i => i.TenantId == tenantId!.Value && paymentIds.Contains(i.PaymentId))
            .ToDictionaryAsync(i => i.PaymentId, i => i.Number, ct);

        var plan = sub?.Plan;
        return Ok(new
        {
            plan = plan != null
                ? new { name = plan.Name, price = plan.Price, currency = plan.Currency, endDate = sub!.EndDate }
                : (object?)null,
            autoRenew = sub?.AutoRenew ?? false,
            payments = payments.Select(p => new
            {
                p.Id,
                date = p.CreatedAt.ToString("dd.MM.yyyy"),
                p.Amount,
                p.Currency,
                status = p.Status.ToString(),
                trxId = p.TransactionId != null && p.TransactionId.Length > 12 ? p.TransactionId[..12] + "..." : p.TransactionId,
                invoiceNumber = invoices.GetValueOrDefault(p.Id),
            }),
        });
    }

    [HttpGet("receipt/{paymentId:guid}")]
    [Authorize]
    public async Task<IActionResult> GetReceipt(Guid paymentId, CancellationToken ct)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();

        var payment = await _db.Payments
            .Include(p => p.Tenant)
            .Where(p => p.Id == paymentId && p.TenantId == tenantId && p.Status == PaymentStatus.Succeeded)
            .FirstOrDefaultAsync(ct);
        if (payment == null) return NotFound();

        var invoice = await _db.Invoices.FirstOrDefaultAsync(i => i.PaymentId == paymentId, ct);
        var invNum = invoice?.Number ?? $"PAY-{(payment.TransactionId != null && payment.TransactionId.Length >= 8 ? payment.TransactionId[^8..] : paymentId.ToString()[^8..])}";
        var planName = "Abunə";
        if (payment.PlanId != null)
        {
            var plan = await _db.Plans.FindAsync(new object[] { payment.PlanId.Value }, ct);
            planName = plan?.Name ?? planName;
        }

        var html = $@"<!DOCTYPE html><html><head><meta charset=""utf-8""/><title>Çek - {invNum}</title>
<style>body{{font-family:Arial,sans-serif;max-width:600px;margin:40px auto;padding:20px}} 
table{{width:100%;border-collapse:collapse}} td{{padding:8px;border-bottom:1px solid #eee}}
</style></head><body>
<h1>Easy Step ERP — Ödəniş çeki</h1>
<table><tr><td>Çek/Faktura №</td><td>{invNum}</td></tr>
<tr><td>Tarix</td><td>{payment.CreatedAt:dd.MM.yyyy HH:mm}</td></tr>
<tr><td>Müştəri</td><td>{payment.Tenant?.Name ?? "—"}</td></tr>
<tr><td>Xidmət</td><td>{planName}</td></tr>
<tr><td>Məbləğ</td><td>{payment.Amount} {payment.Currency}</td></tr>
<tr><td>Status</td><td>Təsdiqləndi</td></tr>
<tr><td>Trx ID</td><td>{payment.TransactionId ?? "—"}</td></tr></table>
<p style=""margin-top:30px;color:#666;font-size:12px"">Bu çeki çap edə və ya PDF kimi yadda saxlay bilərsiniz (Ctrl+P → PDF olaraq saxla).</p>
</body></html>";

        return Content(html, "text/html; charset=utf-8");
    }

    private Guid? GetTenantId()
    {
        var v = User.FindFirst("tenant_id")?.Value;
        return Guid.TryParse(v, out var id) ? id : null;
    }

    /// <summary>Plan seçib ödəniş səhifəsinə yönəldir. Payriff checkout URL qaytarır.</summary>
    [HttpPost("checkout")]
    [Authorize]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest req, CancellationToken ct)
    {
        var tenantId = GetTenantId();
        if (tenantId == null)
            return Unauthorized();

        var plan = await _db.Plans.FindAsync(new object[] { req.PlanId }, ct);
        if (plan == null || !plan.IsActive)
            return BadRequest(new { message = "Plan tapılmadı" });

        var apiBase = _config["App:ApiBaseUrl"] ?? "http://localhost:5000";
        var webBase = _config["App:BaseUrl"] ?? "http://localhost:3000";
        var callbackUrl = $"{apiBase}/api/billing/webhook/payriff";
        var metadata = new Dictionary<string, string>
        {
            ["tenantId"] = tenantId.Value.ToString(),
            ["planId"] = plan.Id.ToString(),
        };

        var result = await _payment.CreateOrderAsync(
            (decimal)plan.Price,
            plan.Currency,
            $"{plan.Name} - Easy Step ERP",
            callbackUrl,
            metadata,
            ct);

        if (result == null)
        {
            return BadRequest(new { message = "Ödəniş provayderi hazır deyil. Payriff:SecretKey təyin edin." });
        }

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId.Value,
            PlanId = plan.Id,
            Provider = _payment.Name,
            TransactionId = result.OrderId,
            Amount = plan.Price,
            Currency = plan.Currency,
            Status = PaymentStatus.Pending,
            RawEventRef = result.TransactionId,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Payments.Add(payment);
        await _db.SaveChangesAsync(ct);

        return Ok(new { paymentUrl = result.PaymentUrl, orderId = result.OrderId });
    }

    /// <summary>Payriff webhook – ödəniş nəticəsi.</summary>
    [HttpPost("webhook/payriff")]
    [AllowAnonymous]
    public async Task<IActionResult> PayriffWebhook(CancellationToken ct)
    {
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync(ct);
        if (string.IsNullOrEmpty(body))
            return BadRequest();

        var webhookSecret = _config["Payriff:WebhookSecret"];
        if (!string.IsNullOrEmpty(webhookSecret))
        {
            var signature = Request.Headers["X-Webhook-Signature"].FirstOrDefault()
                ?? Request.Headers["X-Signature"].FirstOrDefault();
            if (string.IsNullOrEmpty(signature) || !VerifyWebhookSignature(body, webhookSecret, signature))
                return Unauthorized();
        }

        JsonElement json;
        try
        {
            json = JsonSerializer.Deserialize<JsonElement>(body);
        }
        catch
        {
            return BadRequest();
        }

        var orderId = json.TryGetProperty("orderId", out var o) ? o.GetString() : null;
        var status = json.TryGetProperty("paymentStatus", out var s) ? s.GetString() : null;
        if (string.IsNullOrEmpty(orderId))
        {
            var payload = json.TryGetProperty("payload", out var p) ? p : default;
            orderId = payload.TryGetProperty("orderId", out var o2) ? o2.GetString() : null;
            status = payload.TryGetProperty("paymentStatus", out var s2) ? s2.GetString() : status;
        }

        var payment = await _db.Payments.FirstOrDefaultAsync(
            p => p.TransactionId == orderId, ct);
        if (payment == null)
            return Ok();

        if (status == "PAID" || status == "APPROVED")
        {
            payment.Status = PaymentStatus.Succeeded;
            await _audit.LogAsync("Payment.Succeeded", null, null, null, null, $"{{\"orderId\":\"{orderId}\",\"tenantId\":\"{payment.TenantId}\"}}", ct);
            payment.RawEventRef = body[..Math.Min(500, body.Length)];

            var hasInvoice = await _db.Invoices.AnyAsync(i => i.PaymentId == payment.Id, ct);
            if (!hasInvoice)
            {
                var invCount = await _db.Invoices.CountAsync(ct) + 1;
                _db.Invoices.Add(new Invoice
                {
                    Id = Guid.NewGuid(),
                    TenantId = payment.TenantId,
                    PaymentId = payment.Id,
                    Number = $"INV-{DateTime.UtcNow:yyyyMM}-{invCount:D4}",
                    IssuedAt = DateTime.UtcNow,
                });
            }

            var tenantId = payment.TenantId;
            var planId = payment.PlanId;
            if (planId == null && json.TryGetProperty("payload", out var pl))
                planId = pl.TryGetProperty("metadata", out var m) && m.TryGetProperty("planId", out var pId)
                    && Guid.TryParse(pId.GetString(), out var g) ? g : null;

            if (planId != null)
            {
                var plan = await _db.Plans.FindAsync(new object[] { planId.Value }, ct);
                if (plan != null)
                {
                    var existing = await _db.Subscriptions
                        .FirstOrDefaultAsync(s => s.TenantId == tenantId && s.Status == SubscriptionStatus.Active, ct);
                    if (existing != null)
                        existing.EndDate = existing.EndDate.AddMonths(plan.DurationMonths);
                    else
                    {
                        var start = DateTime.UtcNow;
                        _db.Subscriptions.Add(new Subscription
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            PlanId = plan.Id,
                            Status = SubscriptionStatus.Active,
                            StartDate = start,
                            EndDate = start.AddMonths(plan.DurationMonths),
                            AutoRenew = true,
                        });
                    }
                }
            }
        }
        else if (status == "CANCELED" || status == "DECLINED" || status == "EXPIRED")
        {
            payment.Status = status == "CANCELED" ? PaymentStatus.Cancelled : PaymentStatus.Failed;
        }

        await _db.SaveChangesAsync(ct);
        return Ok();
    }

    private static bool VerifyWebhookSignature(string payload, string secret, string providedSignature)
    {
        byte[] theirHash;
        try
        {
            var s = providedSignature.Trim();
            if (s.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
                s = s[7..];
            theirHash = Convert.FromHexString(s);
        }
        catch
        {
            return false;
        }

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var ourHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return theirHash.Length == ourHash.Length &&
               CryptographicOperations.FixedTimeEquals(ourHash, theirHash);
    }

    private static object DefaultBilling() => new
    {
        plan = new { name = "Pro 12 ay", price = 420, currency = "AZN", endDate = DateTime.UtcNow.AddMonths(6) },
        autoRenew = true,
        payments = new[]
        {
            new { id = Guid.Empty, date = "15.02.2026", amount = 420m, currency = "AZN", status = "Succeeded", trxId = "PAY-xxx..." },
        },
    };
}

public record CheckoutRequest(Guid PlanId);
