# Railway Environment Variables

Add these in **Railway** → easystep-erp → **Variables** → **Raw Editor**.

## Raw Editor — kopyala və əlavə et

Aşağıda parol placeholder ilə — təhlükəsiz (GitHub-a push oluna bilər).
Parolunuzu əlavə etmək üçün **aşağıdakı tam bloku** bu söhbətdə verəcəyəm, oradan kopyalayın.

```
ConnectionStrings__DefaultConnection=${{Postgres.DATABASE_URL}}
Jwt__Key=mySuperSecretKeyForJwtTokensMinimum32Chars!
Cors__Origins__0=https://easysteperp.com
Cors__Origins__1=https://www.easysteperp.com
App__BaseUrl=https://www.easysteperp.com
App__ApiBaseUrl=https://api.easysteperp.com
Smtp__Host=easysteperp.com
Smtp__Port=465
Smtp__User=hello@easysteperp.com
Smtp__From=hello@easysteperp.com
Smtp__UseSsl=true
Affiliate__DefaultDiscountPercent=5
Affiliate__DefaultCommissionPercent=5
App__AcademyYoutubePlaylistId=
Cron__Secret=RAILWAY_CRON_SECRET_BURAYA_QOYUN
Payriff__WebhookSecret=PAYRIFF_WEBHOOK_SECRET_BURAYA_QOYUN
Security__RequireAdminMfa=false
```

> **Vacib:** `__` (iki alt xətt) — bir alt xətt `_` işləməz.
> **SMTP parol:** Parol yalnız Admin panel → E-poçt ayarları → SMTP-də saxlanılır. Railway env-də parol tələb olunmur.
> `${{Postgres.DATABASE_URL}}` — Railway-də Postgres **Add Reference** etdikdə avtomatik yaranır.

> **Profil sil 404/405:** API yenilənəndən sonra Railway-də **Deployments** → **Redeploy** edin.

---

## «Xidmət hazırda əlçatan deyil» – şifrə bərpa / əlaqə formu

Bu xəta əsasən proxy timeout-dan yaranır: e-poçt göndərmə yavaş olduqda Vercel proxy 20–25 saniyədə abort edir.
**Düzəliş (deploy edildi):** Şifrə bərpa və əlaqə formunda e-poçt artıq HTTP cavabından sonra arxa planda göndərilir – istifadəçi dərhal cavab alır, proxy timeout-a düşmür.

## Şifrə sıfırlama e-poçtu gəlmir

Əgər "Şifrə sıfırlama linki göndərildi" yazılsa da e-poçt gəlmirsə:
1. **Admin panel:** E-poçt ayarları → SMTP — Host, İstifadəçi, **Parol**, From doldurulub «Yadda saxla» vurulmalıdır. Parol yalnız admin paneldə saxlanılır
2. **Parol mütləqdir:** İlk dəfə və ya parolu dəyişdirmək üçün parol sahəsinə daxil edib saxlayın (təhlükə üçün sahə boş göstərilir)
3. **Spam:** E-poçt spam qovluğuna düşə bilər
4. **Railway logs:** Deployments → View Logs — "SMTP Password is empty" və ya "forgot-password email failed" axtarın

---

## Satış partnyoru qeydiyyat xətası

Əgər "Qeydiyyat zamanı xəta baş verdi" mesajı alırsınızsa:
1. **Railway Logs:** Deployments → son deployment → View Logs. `RegisterAffiliate failed for` axtarın — ətraflı xəta orada görünəcək
2. **E-poçt artıq mövcuddur:** Eyni e-poçtla əvvəlcədən qeydiyyat olunubsa, "Bu e-poçt artıq qeydiyyatdadır" mesajı gəlir. Başqa e-poçt sınayın
3. **Debug rejimi:** Railway Variables-a `ASPNETCORE_ENVIRONMENT=Development` əlavə edərək deploy etsəniz, formda ətraflı xəta mesajı görünəcək (test üçün)

---

## Railway «Not Found» / «The train has not arrived» / «Failed to fetch»

**Düzəliş deploy edildi:** Repo root-a `Dockerfile` və `railway.toml` əlavə edildi. Root Directory boş olsa belə API düzgün build olacaq. **[RAILWAY-NOT-FOUND-FIX.md](./RAILWAY-NOT-FOUND-FIX.md)** — ətraflı addımlar.

**Tez həll:**
1. **Railway** → API servisi → **Settings** → **General** → **Root Directory** = **boş buraxın** (sıfırlayın)
2. **Deployments** → **Redeploy**
3. **Settings** → **Networking** → domain API servisinə bağlı olduğundan əmin olun
4. 2–3 dəqiqə sonra `https://SIZIN-URL.up.railway.app/api/Health` açın
5. **Vercel** → `API_URL` = bu Railway URL → Redeploy

## «Application not found» / «Bağlantı vaxtı bitdi» / «Failed to fetch» — Admin SMTP

1. Yuxarıdakı Railway domain yoxlamasını edin
2. `www.easysteperp.com/api/ping` açın — health, login status görünür
3. Railway deploy **Success** olmalıdır; 1–2 dəqiqə gözləyib yenidən test edin

## 404/Profil sil işləməzsə — yoxlama

1. **Railway Build:** Deployments → son deploy **Success** (yaşıl) olmalıdır. **Failed** varsa → logları açıb səbəbə baxın.
2. **Root Directory:** Railway → API servisi → Settings → **Root Directory** = `api` olmalıdır.
3. **API Health:** Brauzerdə açın: `https://SIZIN-RAILWAY-URL/api/Health` (məs. `https://2qz1te51.up.railway.app/api/Health`). `{"status":"ok"}` gəlməlidir. Əgər 404 gəlirsə — domain səhvdir və ya API işləmir.
4. **Vercel API_URL:** Vercel → layihə → Settings → Environment Variables. `API_URL` və ya `NEXT_PUBLIC_API_URL` = Railway URL (`https://xxxx.up.railway.app`) və ya `https://api.easysteperp.com`. Sonra Vercel-da **Redeploy**. Bağlantı xətası olarsa → [BAGLANTI-TAMIR.md](./BAGLANTI-TAMIR.md)
5. **Login işləmirsə:** `www.easysteperp.com/api/ping` açın — health, login, adminTenants statusunu göstərər. Əgər health/ok deyilsə — Railway API işləmir.

## Cədvəl formatı

| Name | Value |
|------|-------|
| `ConnectionStrings__DefaultConnection` və ya `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Reference) |
| `Jwt__Key` | min 32 simvol |
| `Cors__Origins__0` | `https://easysteperp.com` |
| `Cors__Origins__1` | `https://www.easysteperp.com` |
| `App__BaseUrl` | `https://www.easysteperp.com` |
| `App__ApiBaseUrl` | `https://api.easysteperp.com` |
| `Smtp__Host` | `mail.easysteperp.com` və ya `easysteperp.com` (Admin paneldə doldurulubsa istifadə olunmur; hosting provayderdən yoxlayın) |
| `Smtp__Port` | `465` |
| `Smtp__User` | `hello@easysteperp.com` |
| `Smtp__From` | `hello@easysteperp.com` |
| `Smtp__UseSsl` | `true` |
| `App__AcademyYoutubePlaylistId` | YouTube playlist ID (Akademiya videoları; məs: PLxxxxxxxx) |
| `Cron__Secret` | Bonus hesablama cron üçün gizli açar (Railway Cron job) |
| `Payriff__WebhookSecret` | Payriff webhook imza yoxlaması üçün (Payriff panelindən alın) |
| `Security__RequireAdminMfa` | `true` = SuperAdmin 2FA məcburi; `false` = opsional (default) |
