# Easy Step ERP — Hostingə yükləmə üçün məlumatlar

Hostinqə deploy edərkən aşağıdakı məlumatları təmin etməlisiniz.

---

## 1. Frontend (Next.js — web qovluğu)

### Environment Variables

Hosting panelində **Environment Variables** bölməsində əlavə edin:

| Dəyişən | Təsvir | Nümunə |
|---------|--------|--------|
| `NEXT_PUBLIC_API_URL` | Backend API-nin tam URL-i | `https://api.easysteperp.com` |

> **Qeyd:** `NEXT_PUBLIC_` ilə başlayan dəyişənlər client-a ötürülür. API URL-i production domain olmalıdır.

### Build əmri
```bash
npm run build
```

### Start əmri
```bash
npm start
```

### Output
- Static + Server: `out` deyil, standart Next.js output
- Node.js 18+ tələb olunur

---

## 2. Backend (ASP.NET Core — api qovluğu)

### Environment Variables və ya appsettings.Production.json

| Parametr | Təsvir | Məcburi |
|----------|--------|---------|
| **ConnectionStrings:DefaultConnection** | PostgreSQL connection string | Bəli |
| **Jwt:Key** | JWT imza açarı (min 32 simvol) | Bəli |
| **Cors:Origins** | Frontend domain(lər)i | Bəli |
| **App:BaseUrl** | Frontend əsas URL | Bəli |
| **App:ApiBaseUrl** | Backend API URL | Bəli |
| **Smtp:Host** | SMTP server | Şifrə sıfırlama üçün |
| **Smtp:Port** | 587 və ya 465 | |
| **Smtp:User** | SMTP login | |
| **Smtp:Password** | SMTP parol | |
| **Smtp:From** | Göndərən email | |
| **Payriff:SecretKey** | Payriff API açarı | Ödəniş üçün |
| **Payriff:WebhookSecret** | Payriff webhook secret | Ödəniş üçün |
| **App:AcademyYoutubePlaylistId** | YouTube playlist ID | Akademiya üçün |

### PostgreSQL connection string nümunəsi
```
Host=your-db-host.com;Port=5432;Database=easystep_erp;Username=dbuser;Password=your_secure_password;SSL Mode=Require;
```

### Production appsettings nümunəsi
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=...;Database=easystep_erp;Username=...;Password=...;SSL Mode=Require"
  },
  "Jwt": {
    "Key": "uzun-ve-təsadufi-açar-minimum-32-simvol-olmali"
  },
  "Cors": {
    "Origins": ["https://easysteperp.com", "https://www.easysteperp.com"]
  },
  "App": {
    "BaseUrl": "https://easysteperp.com",
    "ApiBaseUrl": "https://api.easysteperp.com"
  }
}
```

### Database migration
Deploy-dan əvvəl və ya sonra:
```bash
cd api
dotnet ef database update
```

---

## 3. Hosting strukturunuz

İki variant var:

### Variant A: Ayrı hostinglər
- **Frontend:** Vercel, Netlify, və ya Node.js dəstəyi olan hosting
- **Backend:** Azure, AWS, DigitalOcean, və ya .NET dəstəyi olan hosting
- **Database:** PostgreSQL (managed — məs. Railway, Supabase, Neon)

### Variant B: VPS (bir server)
- **Nginx** — reverse proxy (frontend + api)
- **PM2** və ya **systemd** — Next.js prosesi
- **systemd** — .NET API servisi
- **PostgreSQL** — eyni serverdə və ya ayrıca

---

## 4. Checklist

- [ ] PostgreSQL bazası yaradılıb
- [ ] `dotnet ef database update` icra edilib
- [ ] `NEXT_PUBLIC_API_URL` frontend-də düzgün təyin edilib
- [ ] CORS-da frontend domain əlavə edilib
- [ ] JWT Key təhlükəli və unikal seçilib
- [ ] HTTPS (SSL) aktivdir
- [ ] Payriff API açarı (ödəniş üçün) əlavə edilib
- [ ] SMTP (email üçün) əlavə edilib

---

## 5. Test

1. `https://your-site.com` — əsas səhifə açılır
2. `/login` — giriş işləyir
3. `/pricing` — qiymətlər və API-dən gələn planlar görünür
4. Admin panel `/admin` — SuperAdmin ilə giriş mümkündür
