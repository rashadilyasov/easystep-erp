# Structure.txt – Tələb yerinə yetirmə siyahısı

## 1. Əsas məqsəd
| Tələb | Status |
|-------|--------|
| Müştəri: qeydiyyat → kabinet → paket → ödəniş → yükləmə | ✅ |
| Portal: tarixçə, plan, faktura/çek, auto-renew, bildirişlər | ✅ |
| Desktop: license validation, offline grace | ✅ |

## 2. Rollar (RBAC)
| Rol | Status |
|-----|--------|
| Visitor: landing, qiymətlər, qeydiyyat | ✅ |
| Customer Admin: profil, ödəniş, plan, lisenziya | ✅ |
| Customer User: Academy, support, yükləmə | ✅ |
| Super Admin: tenants, plans, payments, content, audit | ✅ |

## 3. Müştəri axınları
| Tələb | Status |
|-------|--------|
| Qeydiyyat: email+şifrə, şirkət məlumatları, Terms | ✅ |
| Giriş: JWT + Refresh token | ✅ |
| Paketlər: 1/3/6/12 ay | ✅ |
| Payriff hosted checkout | ✅ |
| Webhook: Payment succeeded/failed | ✅ |
| Signed URL download (10 dəq) | ✅ |
| License validate: Active/PastDue/Expired | ✅ |
| Offline grace 7 gün, read-only | ✅ |

## 4. Veb səhifələr
| Səhifə | Status |
|--------|--------|
| Public: Home, Features, Pricing, Security, Contact, Login, Register | ✅ |
| Forgot password, Reset password | ✅ |
| Cabinet: Dashboard, Billing, Downloads, Licenses, Academy, Support, Settings | ✅ |
| Billing: plan, auto-renew, payment history, invoices/çek | ✅ |
| Support: tickets, FAQ | ✅ |
| Admin: Tenants, Plans, Payments, Content, Audit | ✅ |

## 5. Backend API
| Servis | Status |
|--------|--------|
| Auth: register, login, refresh, logout, forgot/reset password | ✅ |
| Plans CRUD (admin) | ✅ |
| Checkout + webhook (signature verification) | ✅ |
| Invoice creation on payment success | ✅ |
| Receipt/çek (HTML, çapa hazır) | ✅ |
| License validate, revoke device | ✅ |
| Signed URL, release list | ✅ |
| Tickets, admin status update | ✅ |
| Rate limiting (auth) | ✅ |
| Audit logs | ✅ |

## 6. DB modeli
| Cədvəl | Status |
|--------|--------|
| Tenants, Users, Plans, Subscriptions, Payments | ✅ |
| Invoices | ✅ |
| Devices, LicenseTokens, Releases | ✅ |
| Tickets, ContactMessages, AuditLogs | ✅ |
| RefreshTokens, PasswordResetTokens | ✅ |

## 7. Təhlükəsizlik
| Tələb | Status |
|-------|--------|
| BCrypt parol hash | ✅ |
| Rate limiting (login/register/forgot) | ✅ |
| Webhook signature verification | ✅ |
| Signed downloads | ✅ |
| Audit append-only | ✅ |
| Hosted checkout (kart məlumatı yoxdur) | ✅ |

## 8. Opsional
| Tələb | Status |
|-------|--------|
| 2FA (TOTP) admin üçün | ✅ |
| Ticket fayl əlavə | ⏳ Gələcək |
| Portmanat (secondary) | ⏳ Gələcək |
| Email OTP verify | ⏳ Gələcək |

## 9. Qəbul meyarları (10)
| Meyar | Status |
|-------|--------|
| Ödəniş sonrası subscription Active | ✅ |
| Download yalnız Active/PastDue | ✅ |
| Desktop 7 gün grace → read-only | ✅ |
| Admin manual extend | ✅ |
| Audit: login, payment, license | ✅ |
| Min: rate limit, webhook verify, signed downloads | ✅ |

---

**Yekun:** Əsas tələblər və qəbul meyarları yerinə yetirilib. Opsional funksiyalar (2FA, ticket attachments) gələcək iterasiya üçün qalır.
