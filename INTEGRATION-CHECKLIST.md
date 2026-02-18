# Integrasiya yoxlaması

## Vercel

| Nə | Harada |
|----|--------|
| Root Directory | `web` |
| `API_URL` | Settings → Environment Variables |
| Redeploy | Deployments → Redeploy |

## Railway

**Settings** → **Networking** → public URL. Bu URL-i Vercel `API_URL`-ə yazın.

## Axın

```
Brauzer → /api/auth/login → Route Handler (app/api/[[...path]]) → Railway API
```

## Popup

Header "Daxil ol" / "Qeydiyyat" → `AuthModal`. Versiya: `data-build="popup-v6"`.
