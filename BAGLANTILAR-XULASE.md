# Bağlantılar və Konfiqurasiya — Xülasə

Bu sənəd bütün API, DB və frontend bağlantılarının vahid baxışını verir.

## Arxitektura

```
Brauzer → www.easysteperp.com (Vercel)
    ↓ fetch("/api/auth/login"), fetch("/api/admin/tenants") və s.
Next.js API Routes (Vercel serverless)
    ├── /api/auth/*  → auth proxy → api.easysteperp.com
    ├── /api/admin/* → admin proxy → api.easysteperp.com
    └── /api/*       → catch-all proxy → api.easysteperp.com
                ↓
        api.easysteperp.com (Railway)
                ↓
        PostgreSQL (Railway, DATABASE_PRIVATE_URL və ya DATABASE_URL)
```

## Konfiq faylları

| Fayl | Məqsəd |
|------|--------|
| `src/lib/api-proxy-config.ts` | `getApiBases()` — `API_URL` → `API_CUSTOM_DOMAIN` → `RAILWAY_PUBLIC_URL`. `2qz1te51.up.railway.app` EXCLUDED. |
| `src/lib/api.ts` | Frontend: `getApiBase()` = `""` — brauzer həmişə relative `/api/*` istifadə edir (proxy üzərindən). |
| `next.config.js` | `NEXT_PUBLIC_API_URL` fallback = `https://api.easysteperp.com` (production). |
| `vercel.json` | `functions.maxDuration` = 60s — proxy timeout üçün. |

## Environment Variables

### Vercel (vacib)
| Name | Value | Məqsəd |
|-----|-------|--------|
| `API_URL` | `https://api.easysteperp.com` | Proxy backend-ə bu URL-ə müraciət edir. |

### Railway
| Name | Məqsəd |
|------|--------|
| `DATABASE_PRIVATE_URL` və ya `DATABASE_URL` | Postgres bağlantısı. |
| `Jwt__Key` | JWT imzalama (min 32 simvol). |
| `Cors__Origins__0/1` | `https://easysteperp.com`, `https://www.easysteperp.com` |
| `App__BaseUrl` | `https://www.easysteperp.com` |
| `App__ApiBaseUrl` | `https://api.easysteperp.com` |

## Proxy route-ları

| Next.js route | Backend path | Timeout |
|---------------|--------------|---------|
| `/api/auth/[[...segment]]` | `{base}/api/auth/{segment}` | 60s |
| `/api/admin/[[...segment]]` | `{base}/api/admin/{segment}` | 60s |
| `/api/[[...path]]` | `{base}/api/{path}` | 60s |

Retry: 2 cəhd, 1.5s gecikmə arasında.

## Auth axını

1. Brauzer: `POST /api/auth/login` (relative — proxy istifadə olunur).
2. Auth proxy: `fetch(https://api.easysteperp.com/api/auth/login)` — 60s timeout.
3. Backend `AuthController`: `[Route("api/auth")]`, `[HttpPost("login")]`.
4. Cavab: `accessToken`, `refreshToken`.
5. Frontend timeout: login üçün 60s (`timeoutMs: 60000`).

## Yoxlamalar

- **`/api/ping`** — health, authPing, login, adminTenantsDirect, adminTenantsViaProxy diaqnostikası.
- **`/api/config`** — `apiBase` (frontend üçün, məs. email-settings).
- **`/api/admin/ok`** — admin route-ların işləməsini yoxlayır.

## Uyğunsuzluq düzəlişləri (son dəyişikliklər)

1. **Login timeout:** 30s → 60s.
2. **Vercel functions:** `maxDuration: 60` — serverless vaxt limiti.
3. **API base:** Bütün fallback-lər `api.easysteperp.com` — `2qz1te51` silinib.
4. **email-settings:** `getDirectApiBase` fallback = `api.easysteperp.com`.
5. **RAILWAY-ENV.md:** Vercel bölməsi əlavə edildi, `API_URL` = `https://api.easysteperp.com` təsdiq edildi.
