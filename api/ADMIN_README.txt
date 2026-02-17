Easy Step ERP – Admin Panel

=== GİRİŞ ===
E-poçt: admin@easysteperp.com
Şifrə: Admin123!
(Seed ilə yaradılır. Yalnız SuperAdmin rolü admin paneline daxil ola bilər.)

=== PANELLƏR ===
- Dashboard: Ümumi baxış
- Tenantlar: Şirkətlər, abunə uzatma (1 ay və ya plan dəyişikliyi)
- Planlar: CRUD – yeni plan, redaktə, silmə/deaktivasiya
- Ödənişlər: Ödəniş siyahısı
- Kontent: Biletlər (status: Open, InProgress, Resolved, Closed), əlaqə mesajları, Akademiya
- Audit log: Login və Payment qeydləri

=== KONFİQURASİYA (appsettings.json) ===
App:
  BaseUrl, ApiBaseUrl – frontend/backend URL
  AdminEmail – əlaqə forması bildirişləri üçün
  AcademyYoutubePlaylistId – YouTube playlist

Payriff:
  SecretKey – ödəniş API
  WebhookSecret – webhook imza doğrulaması (opsional)

Smtp: (Forgot password və Contact bildirişləri)
  Host, Port, User, Password, From, UseSsl
  AdminNotify – contact form bildirişləri üçün

Jwt:
  ExpiryMinutes – access token müddəti
  RefreshTokenExpiryDays – default 7

Auth:
  PasswordResetExpiryHours – default 1

=== API ENDPOİNTLƏRİ ===
GET  /api/admin/stats          → totalTenants, activeSubscriptions, revenueThisMonth, openTickets
GET  /api/admin/tenants
POST /api/admin/tenants/{id}/extend
GET  /api/admin/plans
POST /api/admin/plans
PATCH /api/admin/plans/{id}
DELETE /api/admin/plans/{id}
GET  /api/admin/payments
GET  /api/admin/tickets
GET  /api/admin/tickets/{id}   → tam bilet mətni
PATCH /api/admin/tickets/{id}/status
GET  /api/admin/contacts
GET  /api/admin/audit
