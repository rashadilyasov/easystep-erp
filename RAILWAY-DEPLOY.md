# Railway — API və PostgreSQL deploy

Frontend artıq Vercel-da: **https://web-gamma-sable-92.vercel.app**

## Addım-addım Railway

### 1. Giriş
1. https://railway.app → **Login** (GitHub ilə)
2. **New Project**

### 2. PostgreSQL
1. **+ New** → **Database** → **PostgreSQL**
2. PostgreSQL servisi yaranacaq
3. Klikləyin → **Variables** tab
4. **`DATABASE_URL`** və ya **`PGConnectionString`** — connection string-i kopyalayın  
   (format: `postgresql://postgres:PASSWORD@host:5432/railway`)

### 3. API servisi
1. **+ New** → **GitHub Repo**
2. **rashadilyasov/easystep-erp** seçin
3. **Root Directory:** `api` yazın (vacibdir)
4. **Deploy** başlayacaq (ilk build uğursuz ola bilər — variables lazımdır)

### 4. Variables əlavə edin
API servisinə keçin → **Variables** → **Add Variable** (və ya Raw Editor):

| Name | Value |
|------|-------|
| `ConnectionStrings__DefaultConnection` | Addım 2-dən PostgreSQL connection string |
| `Jwt__Key` | Uzun təsadüfi açar (min 32 simvol, məs. `MyS3cur3K3yF0rJWT2024!@#`) |
| `Cors__Origins__0` | `https://web-gamma-sable-92.vercel.app` |
| `App__BaseUrl` | `https://web-gamma-sable-92.vercel.app` |
| `App__ApiBaseUrl` | `https://SIZIN-RAILWAY-URL` (Addım 5-dən sonra) |

**ASPNETCORE_ENVIRONMENT** = `Production` (əgər yoxdursa)

### 5. Public domain
1. API servisi → **Settings** → **Networking**
2. **Generate Domain** — public URL alacaqsınız  
   (məs. `easystep-api-production-xxxx.up.railway.app`)
3. Bu URL-i `App__ApiBaseUrl`-ə yazın və variables yeniləyin
4. **Redeploy** edin

### 6. Database migration
API işə düşəndə **avtomatik** `MigrateAsync()` çalışır — əlavə addım lazım deyil.

### 7. Vercel-da API URL
1. https://vercel.com → layihə **web** → **Settings** → **Environment Variables**
2. `NEXT_PUBLIC_API_URL` = `https://SIZIN-RAILWAY-URL.up.railway.app`
3. **Redeploy** (Deployments → ... → Redeploy)

---

## Xülasə

| Addım | Harada | Nə |
|-------|--------|-----|
| 1 | railway.app | Login, New Project |
| 2 | Railway | + New → PostgreSQL |
| 3 | Railway | + New → GitHub Repo (api) |
| 4 | Railway | API Variables əlavə et |
| 5 | Railway | Generate Domain |
| 6 | Lokal | `dotnet ef database update` |
| 7 | Vercel | NEXT_PUBLIC_API_URL, Redeploy |
