# Easy Step ERP — Hosting Tələbləri

Bu sənəd layihəni host etmək üçün lazım olan bütün texniki tələbləri siyahıya alır.

---

## 1. Proqram Tətbiqləri (Software)

| Tələb | Minimum versiya | Qeyd |
|-------|-----------------|------|
| **Node.js** | 18.x və ya üstü | Next.js frontend üçün |
| **npm** | 9.x və ya üstü | Node ilə gəlir |
| **.NET SDK / Runtime** | 8.0 | ASP.NET Core API üçün |
| **PostgreSQL** | 14.x və ya üstü | Əsas verilənlər bazası |

---

## 2. Frontend (Next.js)

| Parametr | Dəyər |
|----------|-------|
| Framework | Next.js 14.x |
| React | 18.x |
| Build əmri | `npm install` sonra `npm run build` |
| İşə salma əmri | `npm start` və ya `node .next/standalone/server.js` (standalone build ilə) |
| Port | 3000 (default) və ya `PORT` env |
| Node engines | >= 18 |

---

## 3. Backend (ASP.NET Core API)

| Parametr | Dəyər |
|----------|-------|
| Framework | .NET 8.0 |
| Build əmri | `dotnet publish -c Release -o out` |
| İşə salma əmri | `dotnet out/EasyStep.Erp.Api.dll` |
| Port | 5000, 8080 və ya `PORT` env ilə |
| Root Directory | `api` qovluğu layihə root-indən |

**Paketlər:**
- ASP.NET Core Web API
- Entity Framework Core 8
- Npgsql (PostgreSQL driver)
- JWT Authentication
- BCrypt, Otp.NET, Swagger

---

## 4. Verilənlər bazası (PostgreSQL)

| Parametr | Dəyər |
|----------|-------|
| Versiya | 14.x və ya üstü |
| Əlaqə formatı | `Host=...;Port=5432;Database=easystep_erp;Username=...;Password=...;Ssl Mode=Require` |
| PostgreSQL URI | `postgresql://user:pass@host:5432/dbname` də dəstəklənir |
| Migrasiya | `dotnet ef database update` (ilk deploy-da) |

---

## 5. Şəbəkə və Portlar

| Xidmət | Port | Protokol |
|--------|------|----------|
| Frontend (Next.js) | 3000 və ya 80/443 | HTTP/HTTPS |
| Backend API | 5000 və ya 8080 | HTTP/HTTPS |
| PostgreSQL | 5432 | TCP (daxili) |

---

## 6. Environment Variables (Minimum)

### Frontend (Next.js)
| Name | Nümunə | Zəruri |
|------|--------|--------|
| `NEXT_PUBLIC_API_URL` və ya `API_URL` | `https://api.easysteperp.com` | Bəli |
| `NODE_ENV` | `production` | Bəli (prod üçün) |

### Backend (API)
| Name | Nümunə | Zəruri |
|------|--------|--------|
| `ConnectionStrings__DefaultConnection` və ya `DATABASE_URL` | PostgreSQL connection string | Bəli |
| `Jwt__Key` | min 32 simvol təsadüfi açar | Bəli |
| `Cors__Origins__0` | `https://www.easysteperp.com` | Bəli |
| `Cors__Origins__1` | `https://easysteperp.com` | Tövsiyə |
| `App__BaseUrl` | `https://www.easysteperp.com` | Bəli |
| `App__ApiBaseUrl` | `https://api.easysteperp.com` | Bəli |

### Opsional
| Name | Məqsəd |
|------|--------|
| `Smtp__Host`, `Smtp__Port`, `Smtp__User`, `Smtp__Password` | E-poçt göndərmə |
| `Resend__ApiKey` | Resend e-poçt API (SMTP alternativ) |
| `Payriff__SecretKey`, `Payriff__WebhookSecret` | Ödəniş inteqrasiyası |
| `Cron__Secret` | Cron job təhlükəsizliyi |

---

## 7. Sistem Resursları (təxmini)

| Resurs | Minimum | Tövsiyə |
|--------|---------|---------|
| RAM | 1 GB | 2 GB |
| CPU | 1 core | 2 core |
| Disk | 2 GB | 5 GB |
| Şəbəkə | HTTPS üçün giriş/çıxış | - |

---

## 8. SSL / HTTPS

| Tələb | Açıqlama |
|-------|-----------|
| SSL sertifikatı | Let's Encrypt və ya ödənişli |
| Domain | `www.easysteperp.com`, `easysteperp.com` |
| API subdomain | `api.easysteperp.com` (və ya eyni host üzərindən path) |

---

## 9. Proses / Daemon

Hər iki proqram eyni anda işləməlidir:

1. **Next.js** — frontend server (port 3000 və ya reverse proxy arxasında)
2. **ASP.NET Core** — API server (port 5000/8080)

**VPS/Dedicated üçün:** `systemd`, `pm2`, `supervisor` və ya `screen`/`nohup` ilə davamlı işə sala bilərsiniz.

---

## 10. Qovluq Quruluşu

```
/
├── api/                 # Backend (ASP.NET)
│   ├── Controllers/
│   ├── Data/
│   ├── Program.cs
│   ├── EasyStep.Erp.Api.csproj
│   └── ...
├── src/                 # Frontend (Next.js)
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── ...
├── package.json
├── next.config.js
└── ...
```

---

## 11. İlk Deploy Addımları

1. PostgreSQL yaradın, `easystep_erp` database qurun
2. API üçün connection string təyin edin
3. `cd api` → `dotnet ef database update` (migrasiya)
4. API-ni işə salın
5. Frontend üçün `API_URL` / `NEXT_PUBLIC_API_URL` = API-nin public URL-inə qoyun
6. `npm install` → `npm run build` → `npm start` (frontend)
7. Reverse proxy (nginx/apache) — frontend 80/443, API subdomain və ya `/api` path üzərindən

---

## 12. Xülasə

| Komponent | Tələb |
|-----------|-------|
| **Runtime** | Node.js 18+, .NET 8, PostgreSQL 14+ |
| **Build** | npm, dotnet CLI |
| **Şəbəkə** | HTTPS, 2 port (frontend + API) |
| **Disk** | min 2 GB |
