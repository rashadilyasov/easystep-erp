# Railway Environment Variables

Add these in **Railway** → easystep-erp → **Variables** → **Raw Editor**.

## Raw Editor — kopyala-yapışdır

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
Smtp__Password=BURADA_E_POCT_PAROLU
Smtp__From=hello@easysteperp.com
Smtp__UseSsl=true
```

> **Vacib:** `__` (iki alt xətt) istifadə edin. `Cors_Origins_0` (bir alt xətt) işləyir, amma `Cors__Origins__0` tövsiyə olunur.
> `Smtp__Password` — hello@easysteperp.com hesabının parolunu yazın.
> `${{Postgres.DATABASE_URL}}` — **Add Reference** ilə Postgres seçəndə avtomatik yaranır.

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
