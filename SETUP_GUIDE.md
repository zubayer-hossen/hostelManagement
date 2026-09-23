# Setup Guide

## Requirements
Node.js ≥ 18.18 (20 or 22 recommended), npm, MongoDB (local, Docker, or a free MongoDB Atlas cluster).

## 1. Install
```bash
cd server && npm install
cd ../client && npm install
```

## 2. Configure the server
```bash
cd server
cp .env.example .env
```
Edit `server/.env`:
- `MONGO_URI` — e.g. `mongodb://127.0.0.1:27017/digital_hostel` or your Atlas URI
- `JWT_SECRET` and `JWT_REFRESH_SECRET` — two different random strings (≥ 32 chars):
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` — your first login (password: 8+ chars, upper + lower + number). Optionally fill the Owner / Admin / Manager seed vars too.

Local MongoDB with Docker (optional): `docker run -d --name dhms-mongo -p 27017:27017 mongo:7`

## 3. Seed
```bash
cd server && npm run seed
```
Creates roles, the staff users from your env, default site settings, sample website content (facilities, weekly menu, FAQ, notices, banners, pages) and 13 sample rooms with beds and builds indexes. Safe to re-run (existing data is kept).

## 4. Run
```bash
# terminal 1
cd server && npm run dev        # http://localhost:5000  (health: /api/v1/health)
# terminal 2
cd client && npm run dev        # http://localhost:5173
```
Open http://localhost:5173 and log in with the seeded Super Admin.

## 4a. Staff accounts and room requests
Log in as the seeded Owner/Manager to reach **Dashboard → Room requests** and **Manage rooms** (Super Admin, Owner and Manager have these permissions by default). Sample rooms are ordinary rooms — archive or edit them from *Manage rooms*.
`BOOKING_HOLD_DAYS` (default 3) controls how long a pending request keeps its bed reserved.

## 4a-2. Residents, rent and complaints
After a booking is approved, **Room requests → Move in** creates the resident. Then use **Residents** (verify, transfer, warnings, move-out), **Finance** (Generate monthly rent, record payments) and **Complaints**. Managers and Owners have these permissions by default; Admins do not.
Choose which resident details are mandatory with `PUT /settings` → `residentForm.requiredFields` (see `API_DOCUMENTATION.md`).

## 4b. Managing website content
Log in as Owner / Super Admin (or Admin for content) → **Website content** in the sidebar (banners, headlines, facilities, food menu, notices, FAQ, gallery, pages) and **System → Settings** (hostel name, contact, map, theme, navigation, homepage sections). Image fields take a link for now (file upload comes in Phase 5B). The Gallery starts empty because it needs your real photos.

## 4c. Image uploads
By default images are stored on the API server's disk (`server/uploads`, `STORAGE_PROVIDER=local`). Set `SERVER_URL` to the public URL of the API in production. If your host wipes its disk on restart (Render/Railway free plans), use Cloudinary: create a free account, then set `STORAGE_PROVIDER=cloudinary` and the three `CLOUDINARY_*` variables.

## 4d-2. Chatbot
Works out of the box with `AI_PROVIDER=none` (built-in answers only, from your published content). To let it phrase answers more naturally, set `AI_PROVIDER=openai_compatible`, `AI_API_KEY` and, if not using OpenAI itself, `AI_BASE_URL`/`AI_MODEL` for your provider (Azure OpenAI, OpenRouter, a local server, etc). It still only uses the same public facts and never fabricates prices, rules or availability.

## 4d. Background jobs and visitor counters
The API starts a small scheduler (rent-due and meeting reminders, expiry of unanswered room requests). Keep `ENABLE_SCHEDULER=true` on exactly one server instance and `false` on any others. Serverless hosts cannot run it — use a normal Node web service (Render, Railway, VPS). Visitor counting needs no setup; it stores no IP addresses or cookies.

## 5. E-mail in development
Support-ticket, booking, payment and warning e-mails use the same mail settings. Leave `EMAIL_HOST` empty: verification/reset links are **printed in the server console**. For real e-mail, set `EMAIL_HOST/PORT/USER/PASSWORD/FROM` (e.g. Gmail app password, Brevo, Mailgun SMTP).

## 6. Tests & checks
```bash
cd server && npm test               # unit tests
cd server && npm run check:imports  # static import check
cd client && npm run check:imports
cd client && npm run build          # production build
```
Manual end-to-end checklist: `docs/TESTING.md`.

## 7. Production (summary — full guide in Phase 8)
- **Database:** MongoDB Atlas; allow your server's IP; use a dedicated DB user.
- **Backend (Render/Railway/VPS):** build `npm install`, start `npm start`. Set every variable from `server/.env.example`, plus `NODE_ENV=production`, `CLIENT_URL=https://your-frontend`, `COOKIE_SECURE=true`, `TRUST_PROXY=1`. Run `npm run seed` once.
- **Frontend (Vercel/Netlify):** root `client`, build `npm run build`, output `dist`. Set `VITE_API_URL=https://your-api/api/v1`. `vercel.json` / `public/_redirects` already handle SPA routing.
- **Different domains for API and site:** set `COOKIE_SAMESITE=none` (requires HTTPS + `COOKIE_SECURE=true`). Same registrable domain (e.g. `app.x.com` + `api.x.com`) also works with `lax`.
- Always serve over HTTPS.

## Troubleshooting
| Symptom | Fix |
|---|---|
| Server exits with "Invalid environment configuration" | Fill the listed variables in `server/.env` |
| `MongooseServerSelectionError` | MongoDB not running / wrong `MONGO_URI` / Atlas IP not allowed |
| Login works but reload logs you out | Cookie not stored: check `COOKIE_SECURE` (must be false on http) and that you use the Vite dev URL, not port 5000 |
| "Not allowed by CORS" / "origin not allowed" | `CLIENT_URL` must exactly match the browser origin (scheme + host + port) |
| Seed says password too weak | Use 8+ chars with upper, lower and a number |
