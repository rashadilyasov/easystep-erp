# Hostingə yükləyərkən PostgreSQL-ə keçid

Lokal test üçün SQLite istifadə olunur. Hostingə deploy edəndə PostgreSQL-ə keçmək üçün:

## 1. `api/appsettings.Development.json` (və ya hosting mühitində `appsettings.json`)

**Silin** və ya override edin:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=YOUR_DB_HOST;Database=easystep_erp;Username=YOUR_USER;Password=YOUR_PASSWORD"
  }
}
```

`Data Source=easystep_erp.db` olan sətir PostgreSQL connection string ilə əvəz olunmalıdır.

## 2. Mühit dəyişənləri (hosting)

Connection string-i environment variable kimi təyin edə bilərsiniz:

```
ConnectionStrings__DefaultConnection=Host=...;Database=...;Username=...;Password=...
```

## 3. Migration

PostgreSQL istifadə edəndə `EnsureCreated` deyil, `MigrateAsync` işləyir — mövcud Npgsql migrationlar avtomatik tətbiq olunacaq.

---

**Lokal test:** `appsettings.Development.json`-da `Data Source=easystep_erp.db` qalır, heç bir PostgreSQL lazım deyil.
