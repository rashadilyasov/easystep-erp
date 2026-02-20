# Easy Step ERP Customer Portal

Təchizatçı şirkətləri üçün müştəri portalı: qeydiyyat → kabinet → paket seçimi → ödəniş → yükləmə.

## Struktur

```
├── web/          # Next.js frontend (TypeScript + Tailwind)
├── api/          # ASP.NET Core Web API
└── Structure.txt # Layihə tələbləri
```

## İşə salma

### API (Backend)

```bash
cd api
dotnet restore
# PostgreSQL lazımdır; yoxdursa: dotnet ef database update
dotnet run
```

API: http://localhost:5000  
Swagger: http://localhost:5000/swagger

### Web (Frontend)

```bash
cd web
npm install
npm run dev
```

Web: http://localhost:3000

### Mühit dəyişənləri

- **api**: `appsettings.Development.json` və ya env vars
- **web**: `.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:5000`

### Konfiqurasiya (appsettings)

- **Payriff**: `SecretKey`, `WebhookSecret` — ödəniş və webhook imza
- **Smtp**: `Host`, `User`, `Password` — forgot password və contact bildirişləri
- **App**: `AdminEmail`, `BaseUrl`, `ApiBaseUrl`, `AcademyYoutubePlaylistId`

## Rollar

| Rol | Təsvir |
|-----|--------|
| Visitor | Landing, pricing, qeydiyyat |
| Customer Admin | Kabinet: billing, plan, istifadəçilər |
| Customer User | Academy, support, yükləmə |
| Super Admin | Admin panel |
| Satış ortağı | Promo kodlar, komissiyalar, satış ortağı paneli |

## Satış ortağı modulu

- **Qeydiyyat:** `/register-affiliate` — satış ortağı kimi qeydiyyat
- **Promo kodlar:** Hər satış ortağı unikal kodlar yaradır; hər kod yalnız 1 müştəri tərəfindən istifadə olunur
- **Müştəri:** `/register`-da promo kod daxil edir; qeydiyyatdan sonra ödənişlərdə endirim tətbiq olunur
- **Komissiya:** Ödəniş uğurlu olanda satış ortağına PENDING komissiya yazılır; admin approve/payout edir
- **Təkrarlanan:** Müştəri hər ay ödəyəndə yenidən komissiya hesablanır
- **Qiymətlər:** Promo kod daxil edərək endirimi önizləmək mümkündür

## Admin panel

- Giriş: `admin@easysteperp.com` / `Admin123!` (seed)
- Panellər: Tenantlar, Planlar (CRUD), Ödənişlər, Kontent (biletlər + əlaqə), Audit
- Detay: `api/ADMIN_README.txt`

## Səhifələr

- `/forgot-password` — şifrə bərpa (e-poçt)
- `/reset-password?token=xxx` — yeni şifrə təyin et (e-poçtdakı link)

## Texniki Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: ASP.NET Core 8, EF Core, PostgreSQL
- **Auth**: JWT + Refresh tokens, 2FA (admin)
- **Ödəniş**: Payriff (hosted checkout + webhooks)
