# Easy Step ERP — Hostingə yükləmə (Bluehost və alternativlər)

## ⚠️ Önəmlı məlumat

**Bluehost shared hosting** (adi plan) bu layihə üçün **uyğun deyil**:
- Next.js üçün **Node.js** lazımdır — Bluehost shared hostingdə yoxdur
- .NET API üçün **ASP.NET Core** lazımdır — Bluehost shared hostingdə yoxdur
- **PostgreSQL** lazımdır — Bluehost-da əsasən MySQL var

**VPS planınız varsa** — texniki bilik ilə qura bilərsiniz, amma bu çətin və vaxt aparandır.

---

## ✅ Tövsiyə: Pulsuz/ucuz alternativlər

Aşağıdakı kombinasiya layihəni rahat deploy etməyə imkan verir:

| Komponent | Hosting | Qiymət | Qeyd |
|-----------|---------|--------|------|
| Frontend (Next.js) | **Vercel** | pulsuz | Avtomatik deploy |
| Backend (API) | **Railway** və ya **Render** | pulsuz / ~\$5 | .NET dəstəyi |
| Database | **Railway** və ya **Supabase** | pulsuz / ~\$0 | PostgreSQL |

Bluehost-un özü isə **yalnız domain** üçün istifadə oluna bilər (domain yönləndirmə).

---

## Addım-addım yükləmə (Vercel + Railway)

### HAZIRLIQ

1. **GitHub** hesabı açın (yoxdursa): https://github.com
2. **Vercel** hesabı: https://vercel.com
3. **Railway** hesabı: https://railway.app

---

### Addım 1: Kodu GitHub-a yükləyin

1. GitHub-da yeni repo yaradın (məs. `easystep-erp`)
2. Layihə qovluğunda terminal açın:

```bash
cd "d:\Cursor\Easy Step ERP WEB"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SIZIN_USERNAME/easystep-erp.git
git push -u origin main
```

> `SIZIN_USERNAME` — GitHub istifadəçi adınız

---

### Addım 2: Frontend-i Vercel-da deploy edin

1. https://vercel.com-a girin
2. **Add New Project**
3. **Import** GitHub reponuzu seçin
4. **Root Directory** — `web` qeyd edin
5. **Environment Variables** əlavə edin:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://SIZIN-API-URL.railway.app` (Addım 4-dən sonra doldurulacaq)
6. **Deploy** klik edin
7. Deploy bitəndə Vercel sizə `https://easystep-erp.vercel.app` kimi bir URL verəcək

---

### Addım 3: Railway-da PostgreSQL yaradın

1. https://railway.app-a girin
2. **New Project** → **Provision PostgreSQL**
3. PostgreSQL servisi yaranacaq
4. **Variables** tab-a keçin
5. `DATABASE_URL` və ya connection string-i kopyalayın (məs. `postgresql://user:pass@host:5432/railway`)

---

### Addım 4: Railway-da API deploy edin

1. Railway-da **New Service** → **GitHub Repo**
2. Reponuzu seçin
3. **Root Directory** — `api` qeyd edin
4. **Settings** → **Build**:
   - Build Command: `dotnet publish -c Release -o out`
   - Start Command: `dotnet out/EasyStep.Erp.Api.dll`
5. **Variables** əlavə edin:

| Name | Value |
|------|-------|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string (Addım 3-dən) |
| `Jwt__Key` | Uzun təsadüfi açar (min 32 simvol) |
| `Cors__Origins__0` | `https://SIZIN-VERCEL-URL.vercel.app` |
| `App__BaseUrl` | `https://SIZIN-VERCEL-URL.vercel.app` |
| `App__ApiBaseUrl` | `https://SIZIN-RAILWAY-URL.up.railway.app` |

6. **Deploy** — Railway build edəcək və API-ni işə sala biləcək
7. **Settings** → **Networking** → **Generate Domain** ilə public URL əldə edin (məs. `easystep-api.up.railway.app`)

---

### Addım 5: Database migration

Railway-da API servisi işə düşəndə database migration lazımdır:

1. Lokalda `api` qovluğunda `.env` və ya environment variable ilə production connection string qoyun
2. Run:

```bash
cd api
dotnet ef database update
```

Və ya Railway **Deploy** zamanı migration scripts əlavə etmək olar (layihəni uyğunlaşdırmaq lazımdır).

---

### Addım 6: Vercel-da API URL-i yeniləyin

1. Vercel → layihəniz → **Settings** → **Environment Variables**
2. `NEXT_PUBLIC_API_URL`-i dəyişin: `https://SIZIN-RAILWAY-URL.up.railway.app`
3. **Redeploy** edin

---

### Addım 7: Domain (Bluehost istifadə etsəniz)

Əgər `www.easysteperp.com` kimi öz domaininiz varsa:

1. **Bluehost** → Domain bölməsi → DNS settings
2. **Vercel**-da: Settings → Domains → `www.easysteperp.com` əlavə edin
3. Vercel göstərdiyi **CNAME** / **A** record-u Bluehost DNS-ə əlavə edin
4. Gözləyin (5 dəq – 48 saat)

---

## Qısa yol: Tek tıklamayla (Railway template)

Railway bəzi layihələr üçün "Deploy with Railway" button təklif edir. Əgər layihəni Railway-ə uyğun formatda qurusaq, bir kliklə deploy mümkün ola bilər. Bu üçün layihənin strukturu bir az dəyişməlidir.

---

## Xülasə

| Addım | Harada | Nə |
|-------|--------|-----|
| 1 | GitHub | Kodu yükləyin |
| 2 | Vercel | Frontend deploy |
| 3 | Railway | PostgreSQL yaradın |
| 4 | Railway | API deploy |
| 5 | Lokal / CI | `dotnet ef database update` |
| 6 | Vercel | API URL yeniləyin |
| 7 | Bluehost | Domain yönləndirmə (istəyə bağlı) |

**Bluehost** əsasən domain və email üçün istifadə oluna bilər; saytın özü Vercel və Railway-da saxlanır.
