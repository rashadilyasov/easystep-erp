# 404 / DNS_HOSTNAME_RESOLVED_PRIVATE — Həll

## Səbəb
Vercel proxy (`/api/*`) serverdə `api.easysteperp.com`-a fetch edəndə `DNS_HOSTNAME_RESOLVED_PRIVATE` xətası verir. Ona görə proxy istifadə olunmur.

## Həll (tətbiq olunub)
Frontend **birbaşa** `https://api.easysteperp.com` çağırır — brauzer API-yə birbaşa müraciət edir, proxy keçirilmir.

## Vercel konfiqurasiyası

### 1. Root Directory
**Settings** → **General** → **Root Directory:** `web`

### 2. Environment Variables
`NEXT_PUBLIC_API_URL` (opsional): `https://api.easysteperp.com`  
— Əgər təyin etsəniz, bu istifadə olunacaq. Yoxdursa, hostname əsasında avtomatik seçilir.

### 3. Redeploy
Dəyişikliklərdən sonra **Redeploy** → **Redeploy with Skip Build Cache**

## Railway CORS (vacib)
Birbaşa brauzer müraciəti üçün CORS düzgün olmalıdır:
- `Cors__Origins__0` = `https://easysteperp.com`
- `Cors__Origins__1` = `https://www.easysteperp.com`

## Yoxlama
1. https://www.easysteperp.com — səhifə açılır
2. **Daxil ol** → popup açılır
3. admin@easysteperp.com / Admin123! → giriş işləyir
