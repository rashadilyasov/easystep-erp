# Niyə yeniliklər dərc olunmur — diaqnostika və həll

## Əsas səbəb (tapıldı)

**Root Directory boş qaldıqda:** Build `web/.next` yaradır, amma Vercel çıxışı **root-da** (`.next`) gözləyir. Nəticə: build "uğurlu" olsa belə, Vercel doğru output-u tapa bilmir və köhnə/boş səhifə deploy edir.

| Root Directory | Build output | Vercel gözlədiyi yer | Nəticə |
|----------------|--------------|----------------------|--------|
| **Boş**        | `web/.next`  | `<root>/.next`       | ❌ Uyğun deyil — köhnə məzmun |
| **`web`**      | `web/.next`  | `web/.next`          | ✅ Doğru |

---

## Həll (addım-addım)

### 1. Vercel Root Directory

**Vercel** → **Settings** → **General** → **Root Directory**

- **`web`** yazın (kiçik hərflə, slash yox)
- **Save** edin

### 2. Root `vercel.json` — əmrləri silmək

`vercel.json`-da `buildCommand` və `installCommand` olmamalıdır. Root Directory `web` olanda Vercel avtomatik `web/` içində `npm install` və `npm run build` işlədir. `cd web &&` əmrləri bu halda səhv işləyir.

### 3. GitHub bağlantısı

- **Settings** → **Git** → Production Branch = `main`
- Repo: `rashadilyasov/easystep-erp`
- `web/` qovluğunun commit edildiyini yoxlayın: `git ls-files web/` boş olmamalıdır

### 4. Redeploy

**Deployments** → son deploy → **⋮** → **Redeploy**

- ✅ **"Redeploy with Skip Build Cache"** seçin

---

## Əlavə yoxlamalar

| Problem | Yoxlama |
|---------|---------|
| `web` qovluğu yoxdur | `git ls-files web/` — ən azı bir fayl göstərməlidir |
| Branch fərqlidir | Vercel-in Production Branch-i main olmalıdır |
| Cache | Redeploy with Skip Build Cache istifadə edin |
| Domain | easysteperp.com bu Vercel layihəsinə yönləndirilməlidir |

---

## Qısa xülasə

1. **Root Directory = `web`** (boş deyil)
2. Root `vercel.json`-dan `buildCommand` və `installCommand` silinmiş olmalıdır
3. Redeploy with Skip Build Cache
