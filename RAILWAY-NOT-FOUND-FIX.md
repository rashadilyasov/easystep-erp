# Railway "Not Found — The train has not arrived" — Həll

## Düzəliş (deploy edildi)

- Repo root-a **Dockerfile** və **railway.toml** əlavə edildi. Root Directory boş olsa belə Railway .NET API-ni build edir.
- **healthcheckPath = "/"** — Railway artıq `/` üzərindən health yoxlayır; deploy vaxtı düzgün routing təmin olunur.
- **Inline ENTRYPOINT** — `entrypoint.sh` əvəzinə Docker-da inline `sh -c` istifadə olunur (Windows CRLF/bad interpreter xətaları aradan qalxdı).

---

## Səbəb (əvvəl)

Root Directory boş olduqda Railway `package.json` görüb **Next.js** build edirdi, `.NET API` yox. Domain bu səhv app-ə yönəlirdi → "Not Found".

---

## Addım-addım həll

### 1. Root Directory-ni sıfırlayın (vacib)

**Railway** → API servisi → **Settings** → **General**:

- **Root Directory** = **boş buraxın** (və ya `/`)
- Yeni root Dockerfile istifadə olunacaq və API düzgün build olacaq

*Əgər Root Directory = `api` qoymaq istəyirsinizsə, bu da işləyir (api/Dockerfile istifadə olunur).*

### 2. Settings → Networking

1. **Settings** → **Networking**
2. **Generate Domain** (domain yoxdursa)
3. Domain: `xxxxx.up.railway.app` — bu URL API servisinə aid olmalıdır

### 3. Domain — düzgün servisə bağlı olmalıdır

Əgər bir neçə servis varsa (PostgreSQL, API və s.), domain **API** servisinə bağlı olmalıdır.

### 4. Redeploy

1. **Deployments** → son deploy → **⋮** → **Redeploy**
2. 2–3 dəqiqə gözləyin
3. `https://YOUR-DOMAIN.up.railway.app/api/Health` açın → `{"status":"ok"...}` gəlməlidir

---

## Tez yoxlama

| Yoxla | Harada |
|-------|--------|
| Root Directory boş və ya `api`? | Settings → General |
| Domain API servisinə aid? | Settings → Networking |
| Deploy Success? | Deployments |
| `https://...up.railway.app/api/Health` | Brauzerdə açın |

---

## Əgər hələ işləmirsə

1. **Yeni servis**: Add Service → GitHub Repo (Root Directory **boş**)
2. PostgreSQL Reference bağlayın
3. Variables köçürün (ConnectionStrings, Jwt, Cors və s.)
4. Generate Domain
