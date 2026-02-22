# Railway: Konteyner işləyir amma URL "Not Found" verir

**Vəziyyət:** Loglar "Starting Container", migrationlar işləyir — API düzgün qalxır. Amma `https://xxx.up.railway.app` açanda "Not Found" görünür.

**Səbəb:** Domain **səhv servisə** bağlıdır və ya heç bir servisə bağlı deyil.

---

## Həll (addım-addım)

### 1. Hansı servisləriniz var?

**Railway Dashboard** → layihəniz. Sizdə minimum belə olmalıdır:
- **PostgreSQL** (Database)
- **API** (və ya easystep-erp adlı GitHub repo servisi)

### 2. Domain kimə bağlıdır?

**API servisinə** daxil olun (PostgreSQL yox).
- **Settings** → **Networking**
- **Domains** bölməsində nə yazır?
  - Əgər heç nə yoxdursa → **Generate Domain** basın
  - Əgər domain varsa (məs. `xxx.up.railway.app`) → bu domain **bu** servisə aid olmalıdır

### 3. Səhv: Domain başqa servisdədir

Əgər domain **PostgreSQL** və ya başqa servisə bağlıdırsa, o servis HTTP dinləmir → "Not Found".

**Düzəliş:** 
- API servisinə keçin
- **Generate Domain** basın (əgər bu servisdə domain yoxdursa)
- Yeni domain `yyy.up.railway.app` alacaqsınız
- Bu URL-i test edin: `https://yyy.up.railway.app/api/Health`

### 4. Vercel API_URL yeniləyin

Yeni/düzgün Railway URL-i aldıqdan sonra:
- **Vercel** → layihə → **Settings** → **Environment Variables**
- `API_URL` və ya `NEXT_PUBLIC_API_URL` = `https://yyy.up.railway.app`
- **Redeploy**

### 5. Yoxlama

Brauzerdə açın:
```
https://SIZIN-RAILWAY-URL.up.railway.app/api/Health
```
Cavab: `{"status":"ok","timestamp":"...","database":"connected"}`

---

## Tez diaqnostika

| Sual | Cavab |
|------|-------|
| Railway-da neçə servis var? | PostgreSQL + API (min 2) |
| Domain hansı servisdə? | **API** servisində olmalıdır |
| API servisində domain var? | Generate Domain əgər yoxdursa |
| Deploy Success? | Bəli olmalıdır |
