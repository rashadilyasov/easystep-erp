# Tez bərpa — Popup, Qeydiyyat, Admin

## 1. Vercel (Frontend)

1. **vercel.com** → layihə → **Deployments**
2. **Redeploy** (ən son deployment) — yeni kod aktiv olacaq
3. **Ctrl+Shift+R** ilə saytı yeniləyin

> API URL artıq avtomatik: Vercel-də `api.easysteperp.com` istifadə olunur.

## 2. Railway (API)

1. **railway.app** → easystep-erp → **Variables**
2. `Cors__Origins__0` = `https://www.easysteperp.com`
3. `Cors__Origins__1` = `https://easysteperp.com`
4. Vercel preview URL əlavə etmək: `Cors__Origins__2` = `https://web-xxxxx.vercel.app` (Deployments-dan URL-inizi götürün)

## 3. Admin girişi

- **URL:** `https://www.easysteperp.com/admin`
- **E-poçt:** `admin@easysteperp.com`
- **Şifrə:** `Admin123!`

Əvvəlcə ana səhifədə "Daxil ol" → popup → giriş edin, sonra /admin-ə keçin.
