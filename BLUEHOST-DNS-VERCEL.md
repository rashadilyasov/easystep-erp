# Bluehost DNS — Fixing Vercel "DNS Change Recommended"

The yellow warning (`DNS Change Recommended`) means DNS records in Bluehost must match the values Vercel recommends.

---

## Step 1: Get exact values from Vercel

1. **Vercel** → project → **Settings** → **Domains**
2. Click **Edit** next to `easysteperp.com`
3. Copy the exact records shown under "DNS Change Recommended"

**Current records for easysteperp.com** (Vercel IP range expansion — 2024/2025):

| Domain | Type | Name/Host | Value/Points to |
|--------|------|-----------|------------------|
| `easysteperp.com` (apex) | **A** | `@` | `216.198.79.1` |
| `www.easysteperp.com` | **CNAME** | `www` | `7eb820fef6505c97.vercel-dns-017.com.` |

> **Note:** Old values (`76.76.21.21`, `cname.vercel-dns.com`) still work, but Vercel recommends the new ones.

---

## Step 2: Update DNS in Bluehost

1. **Bluehost** → https://my.bluehost.com
2. **Domains** → select your domain (`easysteperp.com`)
3. **DNS** or **Zone Editor** (in cPanel: **Advanced** → **Zone Editor**)
4. Add or edit the records shown below

---

### Apex domain: `easysteperp.com`

**Type:** A  
**Host/Name:** `@` (or leave blank)  
**Points to / Value:** `216.198.79.1`  
**TTL:** 300 or 3600 (Default)

If there is an existing A record for `easysteperp.com` (`76.76.21.21` or another IP), **delete or update it** — only `216.198.79.1` should remain.

---

### www subdomain: `www.easysteperp.com`

**Type:** CNAME  
**Host/Name:** `www`  
**Points to / Value:** `7eb820fef6505c97.vercel-dns-017.com.`  
**TTL:** 300 or Default

If there is an existing CNAME or A record for `www` — **delete it** and add this CNAME.

---

## Step 3: Remove conflicting records

In Bluehost, you can delete these if they exist and are not needed for Vercel:
- `www` → CNAME pointing to another site
- `@` → A record pointing to another IP

**Caution:** Do **not** delete `MX`, `TXT` (for email), or other required records.

---

## Step 4: Verification

1. **DNS propagation** — can take from 5 minutes up to 48 hours
2. Vercel → Domains → click **Refresh**
3. Use **whatsmydns.net** to check `easysteperp.com` and `www.easysteperp.com`

The configuration is correct when the yellow warning disappears.

---

## Quick reference (Bluehost Zone Editor)

| Type | Name | Value | Action |
|------|------|-------|--------|
| A | @ | 216.198.79.1 | Add / Edit |
| CNAME | www | 7eb820fef6505c97.vercel-dns-017.com. | Add / Edit |

> **Source:** Vercel Domains → easysteperp.com → Edit — values shown (IP range expansion).
