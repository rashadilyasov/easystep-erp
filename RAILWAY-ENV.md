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
Smtp__Password=BURADA_PAROLUNU_QOY
Smtp__From=hello@easysteperp.com
Smtp__UseSsl=true
Affiliate__DefaultDiscountPercent=5
Affiliate__DefaultCommissionPercent=5
App__AcademyYoutubePlaylistId=
Cron__Secret=RAILWAY_CRON_SECRET_BURAYA_QOYUN
```

> **Vacib:** `__` (iki alt xətt) — bir alt xətt `_` işləməz.
> `${{Postgres.DATABASE_URL}}` — Railway-də Postgres **Add Reference** etdikdə avtomatik yaranır.

> **Profil sil 404/405:** API yenilənəndən sonra Railway-də **Deployments** → **Redeploy** edin.

---

## Satış partnyoru qeydiyyat xətası

Əgər "Qeydiyyat zamanı xəta baş verdi" mesajı alırsınızsa:
1. **Railway Logs:** Deployments → son deployment → View Logs. `RegisterAffiliate failed for` axtarın — ətraflı xəta orada görünəcək
2. **E-poçt artıq mövcuddur:** Eyni e-poçtla əvvəlcədən qeydiyyat olunubsa, "Bu e-poçt artıq qeydiyyatdadır" mesajı gəlir. Başqa e-poçt sınayın
3. **Debug rejimi:** Railway Variables-a `ASPNETCORE_ENVIRONMENT=Development` əlavə edərək deploy etsəniz, formda ətraflı xəta mesajı görünəcək (test üçün)

---

## 404/Profil sil işləməzsə — yoxlama

1. **Railway Build:** Deployments → son deploy **Success** (yaşıl) olmalıdır. **Failed** varsa → logları açıb səbəbə baxın.
2. **Root Directory:** Railway → API servisi → Settings → **Root Directory** = `api` olmalıdır.
3. **API Health:** Brauzerdə açın: `https://SIZIN-RAILWAY-URL/api/Health` (məs. `https://2qz1te51.up.railway.app/api/Health`). `{"status":"ok"}` gəlməlidir. Əgər 404 gəlirsə — domain səhvdir və ya API işləmir.
4. **Vercel API_URL:** Vercel → layihə → Settings → Environment Variables. `API_URL` və ya `NEXT_PUBLIC_API_URL` = `https://api.easysteperp.com` (və ya Railway URL `https://xxxx.up.railway.app`). Sonra Vercel-da **Redeploy**.
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
| `Smtp__Host` | `easysteperp.com` |
| `Smtp__Port` | `465` |
| `Smtp__User` | `hello@easysteperp.com` |
| `Smtp__Password` | e-poçt parolu |
| `Smtp__From` | `hello@easysteperp.com` |
| `Smtp__UseSsl` | `true` |
| `App__AcademyYoutubePlaylistId` | YouTube playlist ID (Akademiya videoları; məs: PLxxxxxxxx) |
| `Cron__Secret` | Bonus hesablama cron üçün gizli açar (Railway Cron job) |
