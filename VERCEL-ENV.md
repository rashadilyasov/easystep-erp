# Vercel Environment Variables

Vercel-da **Settings** → **Environment Variables** əlavə edin:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.easysteperp.com` və ya Railway URL (aşağıya bax) |

> **Vacib:** Bu olmadan qeydiyyat və login işləməz. Dəyişəndən sonra **Redeploy** edin.

## api.easysteperp.com resolve olmur (DNS xətası)?

Kod indi default olaraq **Railway birbaşa URL** istifadə edir: `https://a19hvpgi.up.railway.app`

Əgər Railway-da domain dəyişibsə: **Railway** → API servisi → **Settings** → **Networking** → public `.up.railway.app` URL-i kopyalayın və Vercel-də `NEXT_PUBLIC_API_URL` kimi qoyun, sonra **Redeploy**.

## API xətası alırsınızsa?

1. Vercel-də `NEXT_PUBLIC_API_URL` — Railway URL və ya `https://api.easysteperp.com`
2. Vercel **Redeploy** edin
3. Railway API **Online** olmalıdır
