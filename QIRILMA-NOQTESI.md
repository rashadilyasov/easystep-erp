# Qırılma nöqtəsi — diaqnostika nəticəsi

## Müəyyən edilən problemlər

### 1. Vercel → api.easysteperp.com: ENOTFOUND (əsas səbəb)
- **Vercel logs:** `/api/auth/login` 502, `/api/auth/me` 502, `/api/admin/tenants` 502
- **Ping:** adminPingBackend, adminTenantsDirect — `getaddrinfo ENOTFOUND api.easysteperp.com`
- **Səbəb:** Vercel serverless mühiti `api.easysteperp.com`-i DNS-də həll edə bilmir (bəzi regionlarda custom domain problem yaradır)
- **Health/auth/login 200:** Ehtimal ki CDN cache — cavab köhnə timestamp ilə (2026-02-20)

### 2. Railway Postgres: TCP_ABORT_O / TCP_ABORT_OI
- **Network Flow Logs:** Postgres bağlantıları abort olunur
- **Təsiri:** GetTenants və digər DB sorğuları yavaşlaya və ya uğursuz ola bilər

---

## Həll

### Problem 1: Vercel üçün Railway native URL
Railway `*.railway.app` DNS-də stabil işləyir. Vercel-da:
1. Railway → API servisi → **Settings** → **Networking** → **Domains**
2. `https://xxx.up.railway.app` formatında URL-i kopyalayın
3. Vercel → **Settings** → **Environment Variables**: `API_RAILWAY_URL` = bu URL
4. Redeploy

### Problem 2: Postgres pool
Program.cs-də artıq: Maximum Pool Size=10, Connection Idle Lifetime=60, Command Timeout=30. Əlavə: MinPoolSize=0 (Npgsql default) — boş pool-da bağlantıları tam bağlamağa imkan verir.
