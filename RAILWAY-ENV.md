image.png# Railway Environment Variables

Add these in **Railway** → Your API Service → **Variables**.

## SMTP (Email - hello@easysteperp.com)

| Name | Value |
|------|-------|
| `Smtp__Host` | `easysteperp.com` |
| `Smtp__Port` | `465` |
| `Smtp__User` | `hello@easysteperp.com` |
| `Smtp__Password` | *(hello@easysteperp.com e-poçt parolu - Railway Variables-da əlavə edin)* |
| `Smtp__From` | `hello@easysteperp.com` |
| `Smtp__UseSsl` | `true` |

> **Qeyd:** Railway-da `__` (double underscore) istifadə olunur. SSL üçün port 465.

## App

| Name | Value |
|------|-------|
| `App__BaseUrl` | `https://www.easysteperp.com` |
| `App__ApiBaseUrl` | `https://api.easysteperp.com` |
| `Cors__Origins__0` | `https://easysteperp.com` |
| `Cors__Origins__1` | `https://www.easysteperp.com` |

## Database, JWT (əgər yoxdursa)

| Name | Value |
|------|-------|
| `ConnectionStrings__DefaultConnection` | *(PostgreSQL connection string)* |
| `Jwt__Key` | *(min 32 simvol)* |
