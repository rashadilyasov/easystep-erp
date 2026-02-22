using System.Net;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EasyStep.Erp.Api.Data;
using EasyStep.Erp.Api.Entities;
using EasyStep.Erp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
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
    private readonly IWebHostEnvironment _env;
    private readonly Services.AuditService _audit;
    private readonly AffiliateService _affiliate;
    private readonly ITemplatedEmailService _templatedEmail;
    private readonly ILogger<BillingController> _logger;

    public BillingController(ApplicationDbContext db, IPaymentProvider payment, IConfiguration config, IWebHostEnvironment env, Services.AuditService audit, AffiliateService affiliate, ITemplatedEmailService templatedEmail, ILogger<BillingController> logger)
    {
        _db = db;
        _payment = payment;
        _config = config;
        _env = env;
        _audit = audit;
        _affiliate = affiliate;
        _templatedEmail = templatedEmail;
        _logger = logger;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        try
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
                .Select(p => new { p.Id, p.CreatedAt, p.Amount, p.DiscountAmount, p.Currency, p.Status, p.TransactionId })
                .ToListAsync(ct);

            var paymentIds = payments.Select(p => p.Id).ToList();
            var invoices = paymentIds.Count > 0
                ? await _db.Invoices
                    .Where(i => i.TenantId == tenantId.Value && paymentIds.Contains(i.PaymentId))
                    .ToDictionaryAsync(i => i.PaymentId, i => i.Number, ct)
                : new Dictionary<Guid, string>();

            var tenant = await _db.Tenants
                .Include(t => t.PromoCode)
                .FirstOrDefaultAsync(t => t.Id == tenantId.Value, ct);
            var now = DateTime.UtcNow;
            var promoValid = tenant?.PromoCode != null
                && tenant.PromoCode.Status == PromoCodeStatus.Used
                && (tenant.PromoCode.DiscountValidUntil == null || tenant.PromoCode.DiscountValidUntil > now);
            object? promoInfo = promoValid
                ? new { code = tenant!.PromoCode!.Code, discountPercent = tenant.PromoCode.DiscountPercent, discountValidUntil = tenant.PromoCode.DiscountValidUntil }
                : null;

            var plan = sub?.Plan;
            return Ok(new
            {
                plan = plan != null
                    ? new { name = plan.Name, price = plan.Price, currency = plan.Currency, endDate = sub!.EndDate }
                    : (object?)null,
                autoRenew = sub?.AutoRenew ?? false,
                promoCode = promoInfo,
                payments = payments.Select(p => new
                {
                    p.Id,
                    date = p.CreatedAt.ToString("dd.MM.yyyy"),
                    p.Amount,
                    discountAmount = p.DiscountAmount,
                    p.Currency,
                    status = p.Status.ToString(),
                    trxId = p.TransactionId != null && p.TransactionId.Length > 12 ? p.TransactionId[..12] + "..." : p.TransactionId,
                    invoiceNumber = invoices.GetValueOrDefault(p.Id),
                }),
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Billing Get failed, returning default");
            return Ok(DefaultBilling());
        }
    }

    /// <summary>Qiymətlər səhifəsində promo endirimi önizləməsi üçün. İstifadə olunubsa errorCode: AlreadyUsed qaytarır.</summary>
    [HttpGet("validate-promo")]
    [AllowAnonymous]
    public async Task<IActionResult> ValidatePromo([FromQuery] string? code, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(code))
            return Ok(new { valid = false });
        var (status, promo) = await _affiliate.GetPromoCodeStatusAsync(code.Trim(), ct);
        if (status == AffiliateService.PromoCodeCheckStatus.NotFound)
            return Ok(new { valid = false });
        if (status == AffiliateService.PromoCodeCheckStatus.AlreadyUsed)
            return Ok(new { valid = false, errorCode = "AlreadyUsed" });
        return Ok(new { valid = true, discountPercent = promo!.DiscountPercent });
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

        var enc = (string s) => WebUtility.HtmlEncode(s ?? "—");
        var html = $@"<!DOCTYPE html><html><head><meta charset=""utf-8""/><title>Çek - {enc(invNum)}</title>
<style>body{{font-family:Arial,sans-serif;max-width:600px;margin:40px auto;padding:20px}} 
table{{width:100%;border-collapse:collapse}} td{{padding:8px;border-bottom:1px solid #eee}}
</style></head><body>
<h1>Easy Step ERP — Ödəniş çeki</h1>
<table><tr><td>Çek/Faktura №</td><td>{enc(invNum)}</td></tr>
<tr><td>Tarix</td><td>{payment.CreatedAt:dd.MM.yyyy HH:mm}</td></tr>
<tr><td>Müştəri</td><td>{enc(payment.Tenant?.Name)}</td></tr>
<tr><td>Xidmət</td><td>{enc(planName)}</td></tr>
<tr><td>Məbləğ</td><td>{enc(payment.Amount.ToString())} {enc(payment.Currency)}</td></tr>
<tr><td>Status</td><td>Təsdiqləndi</td></tr>
<tr><td>Trx ID</td><td>{enc(payment.TransactionId)}</td></tr></table>
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

        var tenant = await _db.Tenants
            .Include(t => t.PromoCode)
            .FirstOrDefaultAsync(t => t.Id == tenantId.Value, ct);
        var originalAmount = plan.Price;
        var discountAmount = 0m;
        var now = DateTime.UtcNow;
        var discountStillValid = tenant?.PromoCodeId != null && tenant.PromoCode != null
            && tenant.PromoCode.Status == PromoCodeStatus.Used
            && (tenant.PromoCode.DiscountValidUntil == null || tenant.PromoCode.DiscountValidUntil > now);
        if (discountStillValid)
        {
            discountAmount = Math.Round(originalAmount * (tenant!.PromoCode!.DiscountPercent / 100), 2);
        }
        var finalAmount = originalAmount - discountAmount;
        if (finalAmount <= 0) finalAmount = 0.01m;

        var apiBase = _config["App:ApiBaseUrl"] ?? "http://localhost:5000";
        var callbackUrl = $"{apiBase}/api/billing/webhook/payriff";
        var metadata = new Dictionary<string, string>
        {
            ["tenantId"] = tenantId.Value.ToString(),
            ["planId"] = plan.Id.ToString(),
        };

        var result = await _payment.CreateOrderAsync(
            (decimal)finalAmount,
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
            Amount = finalAmount,
            DiscountAmount = discountAmount,
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
        if (string.IsNullOrEmpty(webhookSecret))
        {
            if (!_env.IsDevelopment())
            {
                _logger.LogWarning("Payriff webhook called but Payriff:WebhookSecret is not set in production");
                return Unauthorized();
            }
        }
        else
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

            try
            {
                await _affiliate.CreateCommissionForPaymentAsync(payment, ct);
            }
            catch { /* commission creation failed – log but don't fail webhook */ }

            try
            {
                var tenant = await _db.Tenants.Include(t => t.Users).FirstOrDefaultAsync(t => t.Id == payment.TenantId, ct);
                var plan = payment.PlanId != null ? await _db.Plans.FindAsync(new object[] { payment.PlanId.Value }, ct) : null;
                var toEmail = tenant?.Users.OrderBy(u => u.CreatedAt).FirstOrDefault()?.Email;
                if (!string.IsNullOrEmpty(toEmail))
                {
                    var userName = (tenant?.ContactPerson ?? "").Trim();
                    if (string.IsNullOrEmpty(userName)) userName = tenant?.Name ?? "Müştəri";
                    await _templatedEmail.SendTemplatedAsync(toEmail, EmailTemplateKeys.PaymentConfirm, new Dictionary<string, string>
                    {
                        ["userName"] = userName,
                        ["amount"] = payment.Amount.ToString("F2"),
                        ["currency"] = payment.Currency ?? "AZN",
                        ["planName"] = plan?.Name ?? "—",
                    }, ct);
                }
            }
            catch { /* email failed – don't fail webhook */ }
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

    private static object DefaultBilling()
    {
        var now = DateTime.UtcNow;
        var endDate12 = now.AddMonths(12);
        return new
        {
            plan = new { name = "Əla 12 ay", price = 999, currency = "AZN", endDate = endDate12 },
            autoRenew = false,
            promoCode = (object?)null,
            payments = Array.Empty<object>(),
        };
    }
}

public record CheckoutRequest(Guid PlanId);
