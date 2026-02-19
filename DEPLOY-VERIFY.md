# Deployment Verification — Dəyişikliklər yüklənmirsə

## 1. Vercel (Frontend — easysteperp.com)

### Root Directory
**Settings** → **General** → **Root Directory**
- Dəyər: `web` (əgər boşdursa və ya yanlışdırsa — `web` yazın)

### Environment Variables
**Settings** → **Environment Variables**
| Name | Value |
|------|-------|
| `API_URL` | `https://2qz1te51.up.railway.app` (Railway URL — api.easysteperp.com DNS işləmirsə) |

### Son deploy
**Deployments** → ən son deployment:
- Status: **Ready** (yaşıl)
- **Redeploy** → **Redeploy with existing Build Cache** — **Skip** (cache-i təmizləmək üçün)

---

## 2. Railway (Backend API — api.easysteperp.com)

### Service status
**easystep-erp** → API servisi → **Deployments**
- Son deploy: **Success**
- **View Logs** — xəta yoxdur

### Networking
**Settings** → **Networking**
- Public domain: `xxxx.up.railway.app` və ya Custom Domain: `api.easysteperp.com`
- API test: `https://2qz1te51.up.railway.app/api/Health` → `{"status":"ok", ...}`

### Variables
CORS və base URL düzgündür:
- `Cors__Origins__0` = `https://easysteperp.com`
- `Cors__Origins__1` = `https://www.easysteperp.com`
- `App__BaseUrl` = `https://www.easysteperp.com`
- `App__ApiBaseUrl` = `https://api.easysteperp.com`

---

## 3. Bluehost DNS (api.easysteperp.com işləmirsə — Railway URL birbaşa işləyir)
**Domains** → **DNS** / **Zone Editor** — Host **yalnız** `api` (tam domain deyil!)
- `api` CNAME → `2qz1te51.up.railway.app`
- `@` A → `216.198.79.1` (Vercel)
- `www` CNAME → `7eb820fef6505c97.vercel-dns-017.com.`

---

## 4. Brauzer cache
Deploy bitəndən sonra:
- **Ctrl+Shift+R** (Windows) və ya **Cmd+Shift+R** (Mac)
- və ya **F12** → **Application** → **Clear site data**

---

## 5. Versiya yoxlaması
**easysteperp.com** açın → **F12** → **Elements**
- `<body data-build="popup-v6">` görünür? — Son frontend versiyası
- **Daxil ol** / **Qeydiyyat** — Header-da popup açılır?

---

## 6. Railway URL tapmaq
**Railway** → easystep-erp → API servisi → **Settings** → **Networking** → **Public Networking**
- Göstərilən URL-i (məs. `xxxx.up.railway.app`) **Vercel** `API_URL`-ə yazın.
- Əgər URL fərqlidirsə — köhnə `2qz1te51` dəyişə bilər.

## 7. Tez həll
| Problem | Həll |
|--------|------|
| Köhnə səhifə | Vercel Redeploy (Skip cache) + Ctrl+Shift+R |
| API cavab vermir | Railway logs yoxla, API_URL Vercel-da düzgündür |
| Popup açılmır | data-build var? Console xəta? API 502? |
| DNS | 24-48 saat propagasiya gözləyin |
