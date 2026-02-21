# Google-da Səhifənin Görünməsi

Sayt Google-da çıxması üçün aşağıdakı addımları edin.

## 1. Texniki hazırlıq (tamamlandı)

- ✅ `robots.txt` — axtarış robotlarına icazə verir (`/robots.txt`)
- ✅ `sitemap.xml` — səhifələrin siyahısı (`/sitemap.xml`)
- ✅ Meta taglar — title, description, Open Graph
- ✅ Structured Data (JSON-LD) — Google üçün

## 2. Google Search Console-a əlavə et

1. **https://search.google.com/search-console** — giriş edin (Google hesabı)
2. **Mülkiyyət əlavə et** → **Domen** və ya **URL prefix**
3. **URL prefix** seçin: `https://www.easysteperp.com`
4. Təsdiq üsullarından biri:
   - **HTML faylı** — `public/`-ə fayl yükləyin (Next.js-də `app/` istifadə olunur, buna görə HTML meta tag təsdiqi daha uyğundur)
   - **HTML meta tag** — `layout.tsx`-də `<meta name="google-site-verification" content="XXXXX" />` əlavə edin (Search Console sizə kodu verəcək)
   - **DNS TXT** — domen provayderində TXT qeyd əlavə edin (domain üzərində tam nəzarət varsa)

5. Təsdiqdən sonra **Sitemaps** → **Yeni sitemap əlavə et** → `https://www.easysteperp.com/sitemap.xml` → Göndər

## 3. Google indexləmə müddəti

- **Yeni saytlar**: bir neçə gündən 2–4 həftəyə qədər
- **Səhifə indeksə alınması**: Search Console-da **URL yoxla** ilə səhifələri əl ilə təqdim edə bilərsiniz

## 4. Yoxlama

- `https://www.easysteperp.com/robots.txt` — robotlara icazə baxışı
- `https://www.easysteperp.com/sitemap.xml` — sitemap baxışı
- Google-da axtarış: `site:www.easysteperp.com` — indeksə alınan səhifələri göstərir
