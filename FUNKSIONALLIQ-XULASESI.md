# Funksionallıq Xülasəsi

## Tamamlanmış funksiyalar

### Kabinet (Müştəri)
| Funksiya | Yer | Status |
|----------|-----|--------|
| Panel, Ödənişlər, Yükləmələr, Lisenziyalar | `/cabinet/*` | ✅ |
| Akademiya (YouTube + əlavə materiallar) | `/cabinet/academy` | ✅ |
| Dəstək (bilet + fayl əlavə) | `/cabinet/support` | ✅ |
| Parametrlər (profil, avtomatik yeniləmə) | `/cabinet/settings` | ✅ |
| 2FA (Authenticator / e-poçt OTP) | `/cabinet/security` | ✅ |
| İstifadəçi dəvəti (CustomerAdmin) | Parametrlər → İstifadəçilər | ✅ |
| Elanlar | Panel (dashboard) | ✅ |

### Admin
| Funksiya | Yer | Status |
|----------|-----|--------|
| Şirkətlər, Planlar, Ödənişlər | `/admin/*` | ✅ |
| Kontent (elanlar, akademiya materialları, biletlər) | `/admin/content` | ✅ |
| E-poçt ayarları, SMTP, şablonlar | `/admin/email-settings` | ✅ |
| 2FA | `/admin/security` | ✅ |

### Dəvət axını
1. CustomerAdmin → Parametrlər → İstifadəçi dəvət et (e-poçt, rol)
2. Dəvət olunan `/invite?token=xxx` linkinə keçir
3. Şifrə təyin edir → Kabinetə yönləndirilir

### Ticket fayl əlavə
- Yeni bilet açarkən PDF, doc, txt, log, png, jpg əlavə edilə bilər
- Maks. 3 fayl, hər biri 5MB
- API: `POST /api/support/tickets/{id}/attachments`

---

## Konfiqurasiya (Railway)

| Dəyişən | Məqsəd |
|---------|--------|
| `App__AcademyYoutubePlaylistId` | Akademiya YouTube videoları (məs: PLxxx) |
| `Cron__Secret` | Bonus hesablama cron job |
| `Smtp__*` | E-poçt göndərmə (dəvət, təsdiq, şifrə sıfırlama) |

---

## Səhifələr siyahısı

- `/` — Ana səhifə
- `/features` — Funksiyalar
- `/pricing` — Qiymətlər
- `/contact` — Əlaqə
- `/login`, `/register` — Giriş, Qeydiyyat
- `/invite?token=xxx` — Dəvət qəbulu
- `/cabinet` — Müştəri paneli
- `/cabinet/security` — 2FA
- `/admin` — İdarə paneli
