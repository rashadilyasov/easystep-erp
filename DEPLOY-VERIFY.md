# Deploy yoxlaması — yeniliklər niyə yüklənmir?

## Əsas səbəb
**Dəyişikliklər commit/push edilməyib.** Vercel yalnız GitHub-a push edilən kodu deploy edir.

## Pipeline
1. **Local** → `git add` + `git commit`
2. **GitHub** → `git push origin main`
3. **Vercel** → GitHub push → avtomatik build & deploy

## Vercel Dashboard — MÜTLƏQ yoxlayın
**Settings** → **General** → **Root Directory** = `web` (boş deyil!)

## Deploy əmrləri
```powershell
cd "d:\Cursor\Easy Step ERP WEB"
git add -A
git commit -m "Deploy: CORS, config updates"
git push origin main
```
Push-dan sonra 1–2 dəq. gözləyin. Vercel avtomatik deploy edəcək.
