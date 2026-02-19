# Vercel deploy — vacib addımlar

## Problem: "Root Directory web does not exist"

### 1. Root Directory — BOŞ saxlayın
**Vercel** → **Settings** → **Build and Deployment** → **Root Directory**

- **Root Directory sahəsini tamamilə BOŞ buraxın** (heç nə yazmayın)
- **Save** edin

Root-da `vercel.json` və `package.json` var — build avtomatik `web/` qovluğundan işləyəcək.

### 2. Redeploy — cache olmadan
**Deployments** → son deploy → **⋮** (3 nöqtə) → **Redeploy**
- **"Redeploy with Skip Build Cache"** seçin
- **Redeploy** düyməsinə basın

### 3. GitHub bağlantısı
- **Settings** → **Git** → **Production Branch** = `main`
- **Deploy Hooks** — hər push-da avtomatik deploy işləyir

### 4. Domain
- **Settings** → **Domains** — `easysteperp.com`, `www.easysteperp.com` əlavə olunubmu?
