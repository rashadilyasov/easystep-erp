# Railway Environment Variables

Add these in **Railway** → easystep-erp → **Variables** → **Raw Editor**.

## Raw Editor — kopyala-yapışdır

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
Smtp__Password=BURADA_PAROLUNU_YAPISTIR
Smtp__From=hello@easysteperp.com
Smtp__UseSsl=true
```

> **Vacib:** `__` (iki alt xətt) — bir alt xətt `_` işləməz.
> `${{Postgres.DATABASE_URL}}` — Railway-də Postgres **Add Reference** etdikdə avtomatik yaranır.

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
