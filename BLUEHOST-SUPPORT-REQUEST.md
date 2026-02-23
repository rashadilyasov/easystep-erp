# Bluehost Support Request — Full-Stack Application Hosting

**Subject:** Can Bluehost host my full-stack web application? I want to consolidate everything on Bluehost (currently using Vercel + Railway).

---

## What I need

I run a web application called **Easy Step ERP** (easysteperp.com) and would like to host the entire stack on Bluehost instead of using multiple providers (Vercel, Railway) which have caused DNS and connectivity issues.

---

## Technical requirements

| Component | Technology | Requirements |
|-----------|------------|---------------|
| **Frontend** | Next.js (Node.js) | Node.js 18+, npm/yarn, ability to run `npm run build` and `npm start` |
| **Backend API** | ASP.NET Core (.NET 8) | .NET 8 runtime, ability to run `dotnet run` or host a .NET web application |
| **Database** | PostgreSQL | PostgreSQL 14+ with persistent storage |
| **Domain** | easysteperp.com | Already managed at Bluehost — need DNS pointing to the application |

---

## What I currently use (and want to move away from)

- **Frontend:** Vercel (Next.js)
- **Backend:** Railway (ASP.NET Core API)
- **Database:** Railway (PostgreSQL)
- **Domain:** Bluehost (DNS only)

---

## Questions for Bluehost

1. **Does Bluehost offer a hosting plan that supports all of the above?**
   - Node.js for Next.js
   - ASP.NET Core / .NET 8 for the API
   - PostgreSQL (not just MySQL)

2. **If shared hosting does not support this stack, which plan do I need?**
   - VPS?
   - Dedicated server?
   - Cloud hosting?

3. **For VPS or higher tiers:** Do you provide managed setup, or would I need to configure Node.js, .NET, and PostgreSQL myself?

4. **SSL/HTTPS:** Can my domain (easysteperp.com) use HTTPS/SSL on the hosted application?

5. **Deployment:** Is there a recommended way to deploy (e.g. Git, FTP, SSH)?

---

## Optional: Application structure

- **Frontend:** Next.js app (static + SSR) in root `/web` or similar
- **Backend:** ASP.NET Core API in `/api` subfolder
- **Database:** PostgreSQL with connection string

All components must be able to communicate on the same server or within the same hosting environment (no cross-provider DNS issues).

---

Thank you for your help. I look forward to consolidating my hosting with Bluehost.

---

## Short version (for chat / ticket)

> I want to host my full-stack app (Next.js + ASP.NET Core + PostgreSQL) entirely on Bluehost. My current setup uses Vercel + Railway and has DNS/connectivity issues. Does Bluehost support Node.js, .NET 8, and PostgreSQL? If not on shared hosting, which plan (VPS, dedicated, etc.) do I need? Can you help me migrate everything to one place?
