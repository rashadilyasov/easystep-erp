# Integrasiya və deploy yoxlaması

## 1. Vercel konfiqurasiya

| Parametr | Dəyər |
|----------|-------|
| Root Directory | `web` |
| Framework | Next.js (avtomatik) |
| Build Command | `npm run build` |

## 2. Vercel Environment Variables

| Name | Value |
|------|-------|
| `API_URL` | Railway backend URL (`https://xxxx.up.railway.app`) |

**Railway URL necə tapılır:** Railway → easystep-erp → Settings → Networking → public domain (.up.railway.app).

`api.easysteperp.com` DNS işləyirsə istifadə edə bilərsiniz.

## 3. Bağlantı axını

```
Brauzer (easysteperp.com)
    → fetch("/api/auth/login")  [same-origin]
    → Next.js (web/src/app/api/[[...path]]/route.ts)
    → proxy fetch(API_URL + "/api/auth/login")
    → Railway backend
```

## 4. Popup və formlar

- **Header:** "Daxil ol" və "Qeydiyyat" → `PublicHeader` → `openLogin()` / `openRegister()`
- **Modal:** `AuthModal` — `AuthModalProvider` daxilində
- **URL:** `/login` → redirect `/?auth=login` → `AuthModalFromUrl` modal açar

## 5. Build versiyası

`<body data-build="popup-v5">` — son deploy versiyasını yoxlamaq üçün F12 → Elements.

## 6. Xəta axtarışı

| Problem | Yoxla |
|---------|------|
| Popup açılmır | F12 Console — JS xəta? |
| API xətası | F12 Network → failed request → Response |
| Dəyişikliklər görünmür | Ctrl+Shift+R, cache təmiz |
| 502 Bad Gateway | Vercel API_URL — Railway URL işləyir? |
