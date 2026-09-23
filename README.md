# Digital Hostel Management System

A modern MERN platform for running a hostel: public website, room booking, resident management, finance, communication and analytics, with a role-based management dashboard.

> **Status: Phases 1–4 of 8 plus admin screens, uploads, events and admin overview (Phase 5A–5C) and support tickets with e-mail notifications (Phase 6A) and meeting scheduling (Phase 6B-1), privacy-first visitor analytics and reminder jobs (Phase 7) — Foundation, Public website, Rooms & booking, Resident management, Admin CMS — code complete, awaiting first runtime verification. Nothing in this project has ever been run — this is the most important remaining step.** See `PROJECT_PROGRESS.md` for exactly what works and what is planned. Features not listed there are **not implemented yet**.

## What exists today
- Secure authentication (JWT access token + rotating HTTP-only refresh cookie, sessions, lockout, e-mail verification, password reset)
- Role-based access control with 6 roles, 24 permissions and privilege-escalation protection, enforced on the backend
- User, role and site-settings APIs, audit logging
- React app with configurable theme/branding, dark mode, English + বাংলা, login/register/reset flows and a dashboard shell

- Public website: dynamic navbar/footer, homepage with hero carousel and headline ticker, Boys/Girls portals, facilities, weekly food menu, gallery with lightbox, notices, FAQ, contact with map/emergency numbers/spam-protected form, rules/terms/privacy pages
- Blog with likes, bookmarks, threaded comments and sharing; a 24/7 chatbot answering from your real published data; SEO sitemap/meta tags; installable PWA with an offline fallback
- Room marketplace with live bed availability, room requests with atomic bed reservation (double-booking safe), staff approval / assignment / move-in / move-out screens, favorites
- Resident lifecycle (move-in → profile → verification → transfer → move-out), monthly rent, manual payments with receipts, complaints, staff-issued warnings, in-app notifications
- Private resident documents, CSV exports
- Image uploads (local or Cloudinary) with a media library, events, admin overview cards
- Admin screens for all website content, settings (theme, navigation, home sections), users, roles/permissions and the audit log

## Tech stack
MongoDB · Express · React 18 (Vite) · Node.js · Tailwind CSS · Framer Motion · Zod · i18next · (Socket.IO, WebRTC in Phase 6)

## Quick start
```bash
cd server && npm install && cp .env.example .env   # fill MONGO_URI, JWT secrets, SEED_SUPER_ADMIN_*
npm run seed && npm run dev
cd ../client && npm install && npm run dev            # http://localhost:5173
```
Full instructions: `SETUP_GUIDE.md`.

## Roles
Super Admin · Owner · Manager · Admin · Hostel Resident · General User — see `PROJECT_ARCHITECTURE.md`.

## Documentation
`SETUP_GUIDE.md` · `PROJECT_ARCHITECTURE.md` · `API_DOCUMENTATION.md` · `PROJECT_PROGRESS.md` · `CHANGELOG.md` · `docs/TESTING.md`

## Roadmap
1 Foundation ✔ → 2 Public website ✔ → 3 Rooms & booking ✔ → 4 Resident management ✔ → 5 Admin CMS ✔ → 6 Communication (support + e-mail + meetings ✔; Socket.IO/WebRTC pending) → 7 Analytics ✔ → 8 Polish ✔ (all code-complete; deployment guide below).
