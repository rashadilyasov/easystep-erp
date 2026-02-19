# Deploy olub amma Qeydiyyat və Popup işləmir — Həll

## Proxy rejimi (Route Handler)

Frontend `/api/...` çağrıları Next.js **Route Handler** (app/api/[[...path]]/route.ts) vasitəsilə Railway API-yə proxy olunur. Brauzer yalnız easysteperp.com-a müraciət edir — DNS və CORS problemi yoxdur.

---

## 1. Railway API URL-i tapın

**Railway** → **easystep-erp** → **Settings** → **Networking**

- **Generate Domain** (əgər yoxdursa) — `xxxx.up.railway.app` alacaqsınız
- Və ya `api.easysteperp.com` (DNS işləyirsə)

Bu URL-in **açılması** lazımdır: `https://URL/api/Health` → `{"status":"ok", ...}`

---

## 2. Vercel Environment Variable (server-side)

**Vercel** → layihə → **Settings** → **Environment Variables**

| Name | Value |
|------|-------|
| `API_URL` və ya `NEXT_PUBLIC_API_URL` | Railway URL (`https://xxxx.up.railway.app` və ya `https://api.easysteperp.com`) |

Dəyişəndən sonra: **Deployments** → **Redeploy** (Production). Əgər köhnə versiya qalıbsa: **Redeploy** → **Redeploy with Skip Build Cache**.

---

## 3. Vercel Root Directory

**Vercel** → **Settings** → **General**

- **Root Directory:** `web` olmalıdır (əgər layihə qovluğu root-dadırsa).

---

## 4. Brauzer cache

Deploy bitəndən sonra:
- **Ctrl+Shift+R** (Windows) və ya **Cmd+Shift+R** (Mac) — hard refresh
- Və ya **F12** → **Application** → **Storage** → **Clear site data**

---

## 5. Popup yoxlaması

easysteperp.com açın → Header-da **"Daxil ol"** və ya **"Qeydiyyat"** klik edin.

Əgər popup açılmırsa:
1. **F12** → **Console** — xəta var?
2. **F12** → **Elements** — `<body data-build="popup-v6">` görünür? (son versiya)

---

## 6. Qeydiyyat yoxlaması

1. **Qeydiyyat** klik → form doldur → **Qeydiyyat** düyməsi
2. Əgər "API xətası" gəlirsə:
   - **F12** → **Network** → `auth/register` və ya `auth/login` sorğusunu tapın
   - **Status** nədir? (400, 401, 500, 502?)
   - **Response** tabında nə yazır? (JSON `message` sahəsi)
   - **Railway** → View logs — API tərəfində xəta var?
3. Ümumi səbəblər:
   - **502** — Proxy API-yə çata bilmir (API_URL, Railway down)
   - **401** — Admin login: "E-poçt və ya şifrə səhvdir" və ya "E-poçtunuz təsdiq olunmayıb"
   - **400** — "Bu e-poçt artıq qeydiyyatdadır"

---

## Tez kontrol siyahısı

| Yoxla | Harada |
|------|--------|
| API işləyir? | `https://API-URL/api/Health` brauzerdə aç |
| Vercel API URL | Settings → Environment Variables |
| Vercel Root | `web` |
| Redeploy edilib? | Deployments → Redeploy |
| Cache təmiz? | Ctrl+Shift+R |
| Popup kodu var? | body `data-build="popup-v6"` |
