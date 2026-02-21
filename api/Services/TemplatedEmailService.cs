namespace EasyStep.Erp.Api.Services;

public class TemplatedEmailService : ITemplatedEmailService
{
    private readonly EmailTemplateService _templates;
    private readonly IEmailService _email;

    public TemplatedEmailService(EmailTemplateService templates, IEmailService email)
    {
        _templates = templates;
        _email = email;
    }

    public async Task<bool> SendTemplatedAsync(string to, string templateKey, IReadOnlyDictionary<string, string> placeholders, CancellationToken ct = default)
    {
        var (subject, body) = await _templates.GetTemplateAsync(templateKey, placeholders, ct);
        if (string.IsNullOrEmpty(subject)) return false;
        return await _email.SendAsync(to, subject, body, ct);
    }
}
