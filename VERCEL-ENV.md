# Vercel Environment Variables

Vercel-da **Settings** → **Environment Variables** əlavə edin:

| Name | Value |
|------|-------|
| `API_URL` və ya `NEXT_PUBLIC_API_URL` | Railway URL (aşağıya bax) |

> **Vacib:** Bu olmadan qeydiyyat və login işləməz. Dəyişəndən sonra **Redeploy** edin.

## Nə işləyir?

API çağrıları Next.js **proxy** ilə gedir. Brauzer yalnız easysteperp.com-a müraciət edir — DNS və CORS problemi yoxdur. Vercel serveri bu müraciətləri Railway API-yə yönləndirir.

**API_URL** — Railway-dan: **Settings** → **Networking** → public URL (`.up.railway.app` və ya `api.easysteperp.com`).

## API xətası alırsınızsa?

1. Vercel-də `API_URL` (və ya `NEXT_PUBLIC_API_URL`) — işləyən Railway URL
2. Vercel **Redeploy** edin
3. Railway API **Online** olmalıdır
