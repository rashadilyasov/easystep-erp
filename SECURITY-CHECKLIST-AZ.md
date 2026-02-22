# Easy Step ERP — Təhlükəsizlik Yoxlama Siyahısı

Bu sənəd verilən tövsiyəyə uyğun olaraq mövcud vəziyyəti və prioritet addımları göstərir.

---

## Tez status cədvəli

| Prioritet | Tövsiyə | Proyektdə vəziyyət |
|-----------|---------|-------------------|
| 1 | MFA admin/maliyyə üçün məcburi | ⚠️ **2FA mövcuddur** (TOTP + e-poçt OTP) amma **məcburi deyil** — admin 2FA olmadan daxil ola bilər |
| 2 | RBAC və SoD | ✅ Rollar: SuperAdmin, CustomerAdmin, CustomerUser, Affiliate. AdminOnly, AffiliateOnly policy-lər |
| 3 | TLS/HTTPS və HSTS | ✅ X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS (prod) — SECURITY-XULASESI |
| 4 | Audit loglar | ✅ AuditService — Login, Payment, PromoCodeUsed və s. |
| 5 | Penetrasiya testi | 📋 Proses — ildə bir və əsas release-dən sonra |
| 6 | Webhook imzalanması | ✅ Payriff webhook HMAC imza yoxlaması (Payriff:WebhookSecret təyin edildikdə) |
| 7 | Məlumat şifrələməsi, backup | 📋 İnfrastruktur — Railway/PostgreSQL, backup planı |
| 8 | Patch və komponent skanları | 📋 CI/CD — dependabot, npm audit |

---

## Artıq tətbiq olunanlar

| Maddə | Təsvir |
|-------|--------|
| **Autentifikasiya** | BCrypt (work factor 12), JWT (60 dəq); refresh token revokasiya (logout) |
| **2FA** | TOTP (Authenticator) və e-poçt OTP; SuperAdmin üçün setup UI |
| **RBAC** | UserRole enum; `[Authorize(Policy = "AdminOnly")]`, `AffiliateOnly` |
| **Security headers** | X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, HSTS (prod) |
| **Rate limiting** | auth: 10/5dəq, contact: 3/dəq, support: 20/5dəq |
| **Webhook** | Payriff: HMAC-SHA256 imza yoxlaması (secret varsa) |
| **XSS** | Receipt və e-poçt şablonlarında HtmlEncode |
| **Fayl upload** | Extension whitelist (.pdf, .doc, .txt, .png və s.), filename sanitization |
| **CORS** | easysteperp.com, www, *.vercel.app — dəqiq match |
| **JWT prod** | Default açar ilə production-da startup xətası |

---

## Prioritət düzəlişlər (30 gün)

### 1. Admin MFA məcburi (prioritet 1) — ✅ TƏTBİQ OLUNUB
**Tətbiq:** `Security__RequireAdminMfa=true` (Railway Variables) — SuperAdmin 2FA olmadan daxil ola bilməz. Default `false` (geri uyğunluq üçün). Bütün adminlərdə 2FA aktivləşdikdən sonra `true` edin.

### 2. Payriff webhook secret məcburi (prioritet 6) — ✅ TƏTBİQ OLUNUB
**Tətbiq:** Production-da `Payriff__WebhookSecret` boşdursa webhook 401 qaytarır. Railway-da `Payriff__WebhookSecret` = Payriff panelindən alınan secret təyin edin.

### 3. JWT və refresh token sənədləşməsi
- `Jwt:ExpiryMinutes` = 60 (default) — < 1 saat ✓  
- `Jwt:RefreshTokenExpiryDays` = 7 — RAILWAY-ENV-ə əlavə edilsin.

---

## İnfrastruktur və proses (60/90 gün)

| Maddə | Nə edilməlidir |
|-------|-----------------|
| **TLS test** | ssllabs.com ilə easysteperp.com skanı; A/A+ hədəf |
| **Backup test** | Railway/PostgreSQL backup bərpası ayda ən az bir dəfə |
| **SIEM/alerting** | Railway logs → mərkəzləşdirilmiş log (opsional: Datadog, Logtail) |
| **Penetrasiya testi** | İllik və major release-dən sonra |
| **SAST/DAST** | CI/CD-ə əlavə etmək (GitHub CodeQL, OWASP ZAP) |
| **RBAC sənədləşmə** | Rollar və icazələr cədvəli RULE.md və ya ADMIN_README-də |

---

## Tez icra üçün

1. **Railway Variables** yoxla:
   - `Payriff__WebhookSecret` — Payriff-dən alınan secret
   - `Jwt__Key` — min 32 simvol
   - `Jwt__ExpiryMinutes` = 60 (opsional, default 60)

2. **Admin 2FA:** Bütün SuperAdmin hesablarında 2FA aktivləşdirilsin (Cabinet → Təhlükəsizlik).

3. **ssllabs.com:** www.easysteperp.com və api.easysteperp.com (və ya Railway domain) skan edilsin.
