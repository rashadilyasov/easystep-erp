# Heç bir yenilik dərc olunmur — addım-addım həll

## Səbəb (ən çox ehtimal)
**Vercel layihəsi GitHub-a qoşulmayıb.** "Connect Git Repository" görünürsə — push heç vaxt deploy etmir.

---

## 1. Git bağlantısını yoxlayın

**Vercel** → layihəniz (**web**) → **Settings** → **Git**

- **Connected Git Repository** — repo görünür? (`rashadilyasov/easystep-erp`)
- Əgər **"Connect Git Repository"** və ya boşdursa → **Connect** → **GitHub** → `easystep-erp` reposunu seçin.
- **Production Branch** = `main` təyin edin.

---

## 2. Root Directory

**Settings** → **General** → **Root Directory**

- **`web`** yazın (kiçik hərflə, slash olmadan).
- **Save**.

---

## 3. Əgər Git artıq qoşulubsa

**Deployments** səhifəsinə keçin:
- Son deployment nə vaxt edilib? (commit mesajı və zaman görünür)
- Əgər son deployment **push-dan çox əvvəl**dirsə — Git bağlantısı işləmir.
- **Redeploy** → **Redeploy with Skip Build Cache** sınayın.

---

## 4. Layihəni sıfırdan import (əgər yuxarıdakılar kömək etmirsə)

1. Yeni layihə: **Add New** → **Project**.
2. **Import Git Repository** → `rashadilyasov/easystep-erp` seçin.
3. **Configure Project**:
   - Root Directory: `web`
   - Framework Preset: Next.js (avtomatik)
4. **Deploy**.
5. **Settings** → **Domains** → `www.easysteperp.com` və `easysteperp.com` əlavə edin.
6. Köhnə layihəni silin və ya domaini yeniyə yönləndirin.

---

## 5. Verifikasiya

Push etdikdən sonra **Deployments** səhifəsində yeni deployment görünməlidir (1–2 dəq. ərzində).
