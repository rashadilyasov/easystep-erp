# cPanel / Bluehost — Sizin imkanlarınız

cPanel-inizdə olanlar əsasında:

---

## ✅ Sizdə olanlar

| Alət | Vəziyyət | Üçün nə |
|------|----------|---------|
| **PostgreSQL** | Var (0/∞) | Database — Easy Step ERP üçün uyğundur |
| **PostgreSQL Database Wizard** | Var | Yeni PostgreSQL DB yaratmaq |
| **phpPgAdmin** | Var | PostgreSQL idarəetməsi |
| **File Manager** | Var | Fayl yükləmə və idarəetmə |
| **FTP Accounts** | Var | Fayl transfer |
| **Git™ Version Control** | Var | Repo clone/deploy |
| **Terminal** | Var | Əmr sətri |
| **MySQL** | Var (17 DB) | Digər saytlar üçün |
| **Softaculous** | Var | Bir kliklə app qurma |

---

## ❌ Yoxdur və ya məhdud

| Lazım olan | cPanel shared hostingda |
|------------|------------------------|
| **Node.js** | "Setup Node.js App" və ya "Node.js Selector" varsa işləyə bilər |
| **.NET / ASP.NET Core** | Ümumiyyətlə yoxdur |

---

## Yoxlamaq lazımdır

cPanel-də **axtarış** (Search Tools) sətrinə yazın:

1. **Node.js** — "Setup Node.js App" və ya "Node.js Selector" varmı?
2. **Application Manager** — Node.js tətbiqləri dəstəklənirmi?

Əgər Node.js varsa: frontend-i (Next.js) Bluehost-da yerləşdirmək mümkün ola bilər.

---

## Realistik yanaşma

### Variant A: PostgreSQL var, Node.js yoxdursa
- **Database:** Bluehost PostgreSQL (database burada)
- **Frontend:** Vercel (Next.js)
- **Backend API:** Railway (ASP.NET Core)

Bu halda Bluehost yalnız DB üçün istifadə olunur; API və frontend kənarda qalır.

### Variant B: Node.js də varsa
- **Database:** Bluehost PostgreSQL
- **Frontend:** Bluehost (Node.js app kimi)
- **Backend API:** Railway (ASP.NET Core)

Bu halda yalnız API Railway-da olur, frontend və DB Bluehost-da.

### Variant C: Hamısı kənarda
- **Hamısı:** Vercel + Railway (ən sadə)
- **Bluehost:** Domain və email üçün

---

## Növbəti addım

cPanel axtarışında **"Node"** və ya **"Node.js"** yazıb nəticəni yoxlayın. Nəticəyə görə hansı variantın sizin üçün uyğun olacağını deyə bilərəm.
