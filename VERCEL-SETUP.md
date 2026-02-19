# Vercel deploy — vacib addımlar

## Problem: Yeniliklər dərc olunmur / "Root Directory web does not exist"

### 1. Root Directory — `web` qeyd edin (VACIB)
**Vercel** → **Settings** → **General** → **Root Directory**

- **`web`** yazın (kiçik hərflə, slash olmadan)
- **Save** edin

Root Directory boş olanda build `web/.next` yaradır, amma Vercel root-da `.next` gözləyir — uyğunsuzluq səbəbindən köhnə məzmun deploy olunur.

### 2. Redeploy — cache olmadan
**Deployments** → son deploy → **⋮** (3 nöqtə) → **Redeploy**
- **"Redeploy with Skip Build Cache"** seçin
- **Redeploy** düyməsinə basın

### 3. GitHub bağlantısı
- **Settings** → **Git** → **Production Branch** = `main`
- **Deploy Hooks** — hər push-da avtomatik deploy işləyir

### 4. Domain
- **Settings** → **Domains** — `easysteperp.com`, `www.easysteperp.com` əlavə olunubmu?
