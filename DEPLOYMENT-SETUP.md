# Easy Step ERP — Deployment Setup (Tam Addımlar)

Admin panelinə daxil olmaq üçün Railway + Vercel düzgün konfiqurasiya edilməlidir.

---

## Addım 1: Railway — PostgreSQL

1. **railway.app** → Login (GitHub)
2. Layihə aç (və ya yeni yarat)
3. **+ New** → **Database** → **PostgreSQL**
4. Postgres servisinə keçid → **Variables** → **Add Reference** → yoxlanılsın ki, `DATABASE_URL` (və ya `${{Postgres.DATABASE_URL}}`) mövcuddur

---

## Addım 2: Railway — API Servisi

1. **+ New** → **GitHub Repo** → `rashadilyasov/easystep-erp` seç
2. **Settings** → **Root Directory**: `api` təyin et
3. **Settings** → **Networking** → **Generate Domain** (və ya mövcud domain)
4. **URL nümunəsi**: `https://easystep-api-production-xxxx.up.railway.app`

---

## Addım 3: Railway — Variables (Vacib)

**Variables** bölməsində əlavə et (və ya **Raw Editor**):

| Ad | Dəyər |
|----|-------|
| `ConnectionStrings__DefaultConnection` | `${{Postgres.DATABASE_URL}}` (Postgres seç → Add Reference) |
| `Jwt__Key` | `mySuperSecretKeyForJwtTokensMinimum32Chars!` (min 32 simvol) |
| `Cors__Origins__0` | `https://easysteperp.com` |
| `Cors__Origins__1` | `https://www.easysteperp.com` |
| `App__BaseUrl` | `https://www.easysteperp.com` |

**Qeyd:** Postgres servisi əlavə etdikdən sonra `${{Postgres.DATABASE_URL}}` reference ilə qoşun.

---

## Addım 4: Vercel — API URL

1. **vercel.com** → layihə (easystep-erp)
2. **Settings** → **Environment Variables**
3. Əlavə et:

| Ad | Dəyər | Environment |
|----|-------|-------------|
| `API_URL` | `https://SIZIN-RAILWAY-URL.up.railway.app` | Production, Preview |

**Sizin Railway URL** = Addım 2-də gördüyünüz domain (məs: `easystep-api-production-abc123.up.railway.app`)

Ətraflı URL **slash** olmadan: `https://xxx.up.railway.app`

---

## Addım 5: Redeploy

1. **Railway** → Deployments → **Redeploy** (və ya yeni push ilə avtomatik)
2. **Vercel** → Deployments → **Redeploy** (env dəyişəndə lazımdır)

---

## Yoxlama

1. Railway loglarında `DB migration and seed completed` mesajı görünməlidir
2. Brauzerdə `https://SIZIN-RAILWAY-URL.up.railway.app/api/Health` açın — `{"status":"ok",...}` gəlməlidir
3. **easysteperp.com** → Daxil ol → `admin@easysteperp.com` / `Admin123!` ilə sınayın

---

## Xətalar

| Xəta | Səbəb |
|------|-------|
| API xətası (500) | DB migration uğursuz və ya `ConnectionStrings__DefaultConnection` yanlış |
| Bağlantı xətası / Backend API-ya çıxış yoxdur | Vercel-də `API_URL` yanlış və ya Railway API işləmir |
| E-poçt və ya şifrə səhvdir | Admin user yoxdur — seed işləməyib və ya fərqli parol |

---

## Admin hesab

- **Email:** `admin@easysteperp.com`
- **Parol:** `Admin123!`
- Seed `DbInitializer.SeedAsync` tərəfindən yaradılır (migrations sonra).
