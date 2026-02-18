# Lokal istifadə

## 1. API (backend) işə salın

```powershell
cd "d:\Cursor\Easy Step ERP WEB\api"
dotnet run
```

API **http://localhost:5000** ünvanında işləyəcək (Development-da).

## 2. DB migration (əgər lazımdırsa)

EmailVerificationTokens və ya digər cədvəllər yoxdursa:

```powershell
cd api
dotnet ef database update
```

(API dayandırılmış olmalıdır.)

## 3. Frontend işə salın

```powershell
cd "d:\Cursor\Easy Step ERP WEB\web"
npm run dev
```

**http://localhost:3000** açın.

## 4. Yoxlama

- Header-da **Daxil ol** / **Qeydiyyat** → popup açılmalıdır
- Qeydiyyat formu doldurub **Qeydiyyat** → uğurlu mesaj

## web/.env.local

```
API_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000
```
