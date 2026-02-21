# Təhlükəsizlik Təkmilləşdirmələri

## Edilən dəyişikliklər

### 1. XSS qorunması (Receipt)
- **Fayl:** `api/Controllers/BillingController.cs`
- **Problemlə:** Çek HTML-də Tenant adı, plan adı və s. birbaşa əlavə olunurdu — potensial XSS
- **Həll:** Bütün output `WebUtility.HtmlEncode()` ilə kodlanır

### 2. Fayl yükləmə təhlükəsizliyi
- **Fayl:** `api/Controllers/SupportController.cs`
- **Problemlə:** Hər hansı fayl tipi, path traversal (../) filename ilə
- **Həll:**
  - İcazəli genişləndirmələr: `.pdf`, `.doc`, `.docx`, `.txt`, `.log`, `.png`, `.jpg`, `.jpeg`
  - `SanitizeFileName()` — `..`, uzun adlar təmizlənir
  - Extension whitelist yoxlaması

### 3. Security headers
- **Next.js:** `src/middleware.ts` — bütün səhifələrə:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **API:** `api/Program.cs`:
  - Eyni header-lər
  - **HSTS** (yalnız production): `max-age=31536000; includeSubDomains; preload`

### 4. Rate limiting
- **Contact form:** 3 müraciət / dəqiqə
- **Support (bilet + fayl):** 20 müraciət / 5 dəqiqə
- Auth əvvəlcədən: 10 / 5 dəq

### 5. CORS sərtləşdirmə
- **Fayl:** `api/Program.cs`
- **Problemlə:** `origin.Contains("easysteperp.com")` — `evil.easysteperp.com`-u da keçirə bilərdi
- **Həll:** Dəqiq match: `https://easysteperp.com`, `https://www.easysteperp.com`, `*.vercel.app`

### 6. JWT Production yoxlaması
- **Fayl:** `api/Program.cs`
- **Problemlə:** Default açar ilə production-da işləyə bilərdi
- **Həll:** Production-da default açar olarsa startup xətası: *"Jwt__Key təyin edilməlidir"*

### 7. Input validasiya
- **Contact:** Name ≤200, Email ≤256, Message ≤5000 simvol
- **Support ticket:** Subject ≤500, Body ≤10000 simvol

---

## Artıq mövcud olanlar
- Auth rate limiting (login, register, forgot)
- Webhook imza yoxlaması (Payriff)
- EF Core parameterized queries (SQL injection azaldılır)
- Hosted checkout (kart məlumatı serverə düşmür)
