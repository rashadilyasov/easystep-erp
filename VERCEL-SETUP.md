# Vercel deploy — vacib addımlar

## Problem: Dəyişikliklər dərc olunmur

### 1. Root Directory yoxlayın
**Vercel** → **Settings** → **General** → **Root Directory**

**İki variant:**

**Variant A:** Root Directory = `web` (tövsiyə olunur)
- Boş buraxmayın
- `web` yazın və **Save**

**Variant B:** Root Directory = boş (repo root)
- Root-da `vercel.json` və `package.json` var
- Build avtomatik `web/` qovluğundan edəcək

### 2. Redeploy — cache olmadan
**Deployments** → son deploy → **⋮** (3 nöqtə) → **Redeploy**
- **"Redeploy with Skip Build Cache"** seçin
- **Redeploy** düyməsinə basın

### 3. GitHub bağlantısı
- **Settings** → **Git** → **Production Branch** = `main`
- **Deploy Hooks** — hər push-da avtomatik deploy işləyir

### 4. Domain
- **Settings** → **Domains** — `easysteperp.com`, `www.easysteperp.com` əlavə olunubmu?
