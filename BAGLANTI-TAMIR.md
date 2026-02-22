# Bağlantı xətası – Daxil olmaq olmur

"Bağlantı xətası. İnterneti yoxlayın və bir az sonra yenidən cəhd edin." və ya login işləmirsə:

## 1. Diaqnostika – /api/ping

Brauzerdə açın: **https://www.easysteperp.com/api/ping**

Bu səhifə göstərəcək:
- Hansı API URL istifadə olunur
- Backend health status
- Login test nəticəsi

**Əgər `health.error` və ya `login.error` görürsünüzsə** — backend çatılmır.

---

## 2. Vercel Environment Variables

**Vercel** → Layihə → **Settings** → **Environment Variables**

| Dəyişən | Dəyər |
|---------|-------|
| `API_URL` | `https://2qz1te51.up.railway.app` (və ya öz Railway URL-iniz) |
| və ya `NEXT_PUBLIC_API_URL` | `https://2qz1te51.up.railway.app` |

**Öz Railway URL-inizi əldə etmək:**
- Railway → easystep-erp → **Settings** → **Networking** → **Public Networking**
- Və ya Deployments → son deploy → **Domain** (məs: `easystep-erp-production.up.railway.app`)

**Dəyişiklikdən sonra:** Vercel → **Deployments** → **Redeploy** (son deployment)

---

## 3. Railway Backend yoxlaması

**Railway** → easystep-erp → **Deployments**

- Son deploy **Success** (yaşıl) olmalıdır
- **View Logs** — xəta mesajı varmı baxın

Backend health birbaşa yoxlamaq üçün brauzerdə açın:
- `https://2qz1te51.up.railway.app/api/Health`

`{"status":"ok"}` gəlməlidir.

---

## 4. api.easysteperp.com istifadə edirsinizsə

Əgər custom domain `api.easysteperp.com` istifadə edirsinizsə:

1. **Railway** → Settings → **Domains** — `api.easysteperp.com` əlavə edin
2. DNS provider-da **CNAME** qeyd: `api` → Railway-in verdiyi host (məs: `xxxx.up.railway.app`)
3. SSL/HTTPS avtomatik Railway tərəfindən verilir

DNS yayılması 5–48 saat çəkə bilər. Bu müddətdə `API_URL` kimi birbaşa Railway URL (`https://2qz1te51.up.railway.app`) istifadə edin.

---

## 5. Sürətli həll

1. **Vercel** → Settings → Environment Variables
2. `API_URL` = `https://2qz1te51.up.railway.app` (əgər bu sizin Railway URL-inizdirsə)
3. **Redeploy** (Deployments → ⋮ → Redeploy)
4. 2–3 dəqiqə gözləyin
5. yenidən daxil olmağa cəhd edin
