# Railway "Not Found — The train has not arrived" — Həll

API logları "Application started", "Now listening on 8080" göstərir, amma `https://2qz1te51.up.railway.app/api/Health` açanda Railway-in "Not Found" səhifəsi çıxır.

---

## Səbəb

Domain hələ də servisə **bağlanmayıb** və ya **səhv servisə** bağlıdır.

---

## Addım-addım həll

### 1. Railway Dashboard — Service seçin

1. **Railway** → layihənizə daxil olun
2. **API servisini** açın (.NET / api qovluğundan deploy olan)
3. Əgər bir neçə servis varsa (məs. `web` və `api`), API olanı seçin

### 2. Settings → Networking

1. Sol menyuda **Settings** → **Networking**
2. **Public Networking** bölməsini tapın
3. **Generate Domain** düyməsinə basın (əgər domain yoxdursa)
4. Domain: `xxxxx.up.railway.app` — bu URL API-yə aid olmalıdır

### 3. Domain kimə aid olduğunu yoxlayın

Əgər `2qz1te51.up.railway.app` artıq varsa:

- **Hansı servisə** bağlıdır? (Deployments və ya Networking altında görünür)
- API servisində **Generate Domain** edin və yeni URL (məs. `abc123.up.railway.app`) alın
- Bu yeni URL üzərindən `/api/Health` sınayın

### 4. Root Directory (vacib)

**Settings** → **General**:

- **Root Directory** = `api` olmalıdır
- **Build Command** və **Start Command** boş qala bilər (Dockerfile istifadə olunur)
- **Dockerfile Path** = `api/Dockerfile` və ya `Dockerfile` (root = api olduqda)

### 5. Redeploy

1. **Deployments** → son deploy → **⋮** → **Redeploy**
2. Domain dəyişdisə, 1–2 dəqiqə gözləyin
3. `https://YOUR-DOMAIN.up.railway.app/api/Health` açın

---

## Tez yoxlama

| Yoxla | Harada |
|-------|--------|
| Domain API servisinə aid? | Settings → Networking |
| Root Directory = api? | Settings → General |
| PORT = 8080? | Proqram `0.0.0.0:8080` dinləyir |
| HTTPS ilə açırsınız? | `https://` (http yox) |

---

## Əgər hələ işləmirsə

1. **Yeni servis yaradın**: Add Service → GitHub Repo → Root Directory = `api`
2. Yeni domain generate edin
3. PostgreSQL-i bu servisə Reference ilə bağlayın
4. Env variables köçürün (ConnectionStrings, Jwt, Cors və s.)
