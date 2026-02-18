# Deploy olub amma Qeydiyyat və Popup işləmir — Həll

## 1. Railway API URL-i yoxlayın

**Railway** → **easystep-erp** (API servisi) → **Settings** → **Networking**

- **Custom Domain:** `api.easysteperp.com` (DNS resolve olmalıdır)
- Və ya **Generate Domain** / public URL: `xxxx.up.railway.app`

**Vacib:** Bu URL-in brauzerdə açılması lazımdır:
```
https://SIZIN-URL/api/Health
```
JSON cavab gəlməlidir: `{"status":"ok", ...}`

---

## 2. Vercel Environment Variable

**Vercel** → layihə → **Settings** → **Environment Variables**

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | Railway-dan aldığınız işləyən URL (api.easysteperp.com və ya .up.railway.app) |

**Əgər `api.easysteperp.com` DNS-də açılmırsa:** Railway-da **Networking** → public `.up.railway.app` URL-i götürün və onu yazın.

Dəyişəndən sonra: **Deployments** → **Redeploy** (Production).

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
2. **F12** → **Elements** — `<body data-build="popup-v4">` görünür? (son versiya)

---

## 6. Qeydiyyat yoxlaması

1. **Qeydiyyat** klik → form doldur → **Qeydiyyat** düyməsi
2. Əgər "API xətası" gəlirsə:
   - **F12** → **Network** → failed request → **Status** və **Response** nədir?
   - Railway **View logs** — API tərəfində xəta var?

---

## Tez kontrol siyahısı

| Yoxla | Harada |
|------|--------|
| API işləyir? | `https://API-URL/api/Health` brauzerdə aç |
| Vercel API URL | Settings → Environment Variables |
| Vercel Root | `web` |
| Redeploy edilib? | Deployments → Redeploy |
| Cache təmiz? | Ctrl+Shift+R |
| Popup kodu var? | body `data-build="popup-v4"` |
