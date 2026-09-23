# PROJECT PROGRESS — Digital Hostel Management System

_Last updated: 2026-09-19 (Session 1 — Phases 1–5, 6A, 6B-1, 7, 8; only Phase 6B-2 remains)_

## Current phase
**Phase 8 (blog, chatbot, SEO, PWA, hardening) code complete. This finishes every planned phase except 6B-2 (Socket.IO live features + WebRTC audio/video), which was deliberately deferred because it cannot be built safely without a running system and a TURN server. Runtime verification of EVERYTHING is PENDING — nothing in this project has ever been executed.**
Everything was written and statically checked (syntax, import/export resolution, undefined-identifier check, translation keys, 51 unit tests) in a sandbox with no npm registry and no MongoDB.

Overall project progress: ~96% of the original spec (all phases except live WebRTC/Socket.IO features)

## Completed features (Phase 1)
- Monorepo structure (`client/`, `server/`, `docs/`, `scripts/`)
- Express API: helmet, CORS (single allowed origin), gzip, rate limiting, NoSQL-operator sanitizer, Zod validation, global error handler, consistent `{success,message,data}` envelope, graceful shutdown
- Auth: register (General User only), login, refresh-token rotation with reuse detection (10s grace for two tabs), logout, logout-all, sessions list/revoke, login history, change password, forgot/reset password, email verification (+ resend), account lockout after failed attempts, optional "require verified email" switch
- RBAC: 6 roles, 24 granular permissions, role hierarchy (anti privilege-escalation), per-user extra permissions, role permissions editable via API; permissions re-read from DB on every request
- Users API (list/search/filter/paginate, create, update, activate/deactivate, change role, set extra permissions, soft delete)
- Roles API, Site settings API (public read, `manageSettings` write), Audit-log model + API
- Email service (nodemailer; prints to console when `EMAIL_HOST` empty) with verification / reset / password-changed templates
- Seed script (roles, staff users from env, default site settings, index sync)
- React 18 + Vite + Tailwind 3: runtime-configurable theme (colors/radius from settings), dark/light/system, EN/বাংলা i18n, auth context with in-memory access token + silent refresh, route guards, public/auth/dashboard layouts, login/register/forgot/reset/verify pages, dashboard overview, profile & security page (edit profile, change password, sessions), 403/404/500 pages, toasts, skeleton-free loaders

## Completed features (Phase 2)
- Models: Banner, Headline, Facility, FoodMenu, Notice, Faq, GalleryItem, PageContent, ContactMessage
- Public read APIs (published-only, date windows, audience-safe) + permission-protected CRUD for banners, headlines, facilities, food menu, notices, FAQ, gallery; pages API (about/boys/girls/rules/terms/privacy); contact form API (rate limit + honeypot; staff can list/update messages via API)
- Settings extended: navigation (EN/BN labels), homepage sections order/visibility, footer, emergency numbers, map landmarks/transport
- Seed: sample banners, headlines, 10 facilities, full weekly menu, FAQ, notices, default pages, navigation & home sections
- Client: dynamic navbar, footer, homepage sections, hero carousel (image/video/gradient), headline ticker, About, Boys/Girls portals, Facilities, Food menu, Gallery + lightbox, Notices, FAQ, Contact (+ emergency card, map, directions, form), Rules/Terms/Privacy, skeleton/error/empty states, safe RichText renderer

## Completed features (Phase 3)
- Models: Room, Bed, Booking, OccupancyRecord, Favorite
- Room marketplace API (filters/search/sort/pagination, stats), staff room + bed management (auto beds, capacity change rules, archive, bed maintenance)
- Booking flow: request (atomic bed reservation), my bookings, cancel, staff approve / reject / hold / notes / reassign bed / move-in / move-out, holds that expire, transition table, audit logging
- Double-booking prevention at DB level (see `PROJECT_ARCHITECTURE.md` → Phase 3) + `server/scripts/double-booking-check.mjs`
- Favorites (rooms), occupancy history, role promotion/demotion on move-in/out
- Client: rooms marketplace, room detail (+bed map, BOOKED / LIMITED AVAILABILITY badges), booking request, My room requests, Favorites, staff "Room requests" and "Manage rooms", Boys/Girls portal stats + rooms, Modal / ConfirmDialog / Pagination

## Completed features (Phase 4)
- Models: Resident, Due, Payment, Complaint, Warning, Notification; `residentForm.requiredFields` setting
- Resident lifecycle: auto-created at move-in, self-service biodata (configurable required fields), rules acknowledgement, verification workflow, room transfer with history, move-out request → approval → move-out with outstanding-dues guard, archive
- Finance: idempotent monthly rent generation, manual charges, atomic overpayment-proof payments with receipts, void (never delete) for dues/payments, staff summary, payment-provider seam
- Complaints (resident + staff workflow, internal notes), Warnings (staff-issued, acknowledge/resolve/withdraw), in-app notifications with bell
- Client: resident overview/profile/payments/warnings/complaints; staff Residents, Finance, Complaints; notification bell in public navbar and dashboard

## Completed features (Phase 5A — client only)
- Generic, config-driven CMS screens for banners, headlines, facilities, food menu, notices, FAQ, gallery; Pages editor with live preview
- Settings editor (general, contact, social, location, emergency, theme, SEO, footer, navigation, home sections, resident form)
- Users, Roles & permissions, Audit-log screens; sidebar groups
- No server changes in 5A

## Completed features (Phase 5B)
- Storage abstraction (local disk / Cloudinary), content-verified image uploads, Media model + API + library screen + reusable image picker
- Events (model, API, public page, admin screen, resident dashboard list)
- Admin overview cards/charts from real data (`/analytics/overview`)

## Completed features (Phase 5C)
- Private resident documents (MongoDB-stored, authenticated access only, staff views audit-logged, review workflow)
- CSV export (7 report types) with formula-injection protection; export buttons on the staff screens
- Markdown toolbar on the Pages editor (a deliberate no-HTML decision instead of an HTML rich-text editor)

## Completed features (Phase 8)
- Blog: posts, scheduling, likes, bookmarks, threaded comments, sharing, comment reporting/moderation, staff screens
- Chatbot: intent + FAQ knowledge from live published data, optional AI-provider rephrasing, honest hand-off, bilingual
- SEO: sitemap.xml, robots.txt, per-page meta/OG tags
- PWA: manifest + offline-fallback service worker (no data caching)
- Security: stricter CSP, explicit cross-origin policy for uploads, health-check exempt from rate limiting

## Completed features (Phase 7)
- Privacy-first visitor tracking (no IP/cookies), online-now / daily / monthly / lifetime counters, admin-switchable homepage badge, Analytics screen (charts, pages, devices, referrers)
- Scheduler: booking-hold expiry, overdue marking, rent-due reminders, meeting reminders (idempotent claims), `ENABLE_SCHEDULER`
- Fixed client settings state dropping `meetings` / `residentForm` groups

## Completed features (Phase 6B-1)
- Meeting scheduling with configurable availability (weekdays, hours, slot length, meetings per slot, advance window, blackout dates, UTC offset), DB-enforced capacity, confirmations/cancellations with notifications + e-mail, staff outcome tracking; in-person and phone-call types only (video deferred to WebRTC)
- Client: Meet the manager page, My meetings, staff Meetings screen, Settings → Meetings

## Completed features (Phase 6A)
- Support tickets: public/guest + signed-in, tracking key for guests, categories/priority/status workflow, assignment, internal notes, staff notifications
- Reusable transactional e-mail wired to ticket, booking, payment and warning events
- Client: public Support page (new + track), My support tickets, staff Support tickets

## Completed files
See tree in `PROJECT_ARCHITECTURE.md`. Server: ~164 source files + 11 test files + 1 script; client: 157 source files (+ config).

## Database models completed
User, Role, Session, LoginHistory, AuditLog, SiteSetting, Resident, Due, Payment, Complaint, Warning, Notification, Room, Bed, Booking, OccupancyRecord, Favorite, Banner, Headline, Facility, FoodMenu, Notice, Faq, GalleryItem, PageContent, ContactMessage (all indexes declared once via `schema.index`).

## API endpoints completed
Phase 1: `/health`, `/auth/*` (15), `/users/*` (7), `/roles/*` (2), `/settings/*` (2), `/audit-logs`. Phase 2: 7 CMS resources × 6 endpoints, `/pages/:key` (2), `/contact` (3). Phase 3: `/rooms` (14), `/bookings` (12). Phase 4: `/residents` (10), `/dues` (6), `/payments` (4), `/complaints` (8), `/warnings` (5), `/notifications` (3) — see `API_DOCUMENTATION.md`.

## Frontend pages completed
Home, Rooms, Room detail, Request a room, About, Boys Hostel, Girls Hostel, Facilities, Food Menu, Gallery, Notices, FAQ, Contact, Rules, Terms, Privacy, Login, Register, Forgot password, Reset password, Verify email, 403, 404.

## Admin pages completed
Staff/admin screens exist for: Room requests, Manage rooms, Residents, Finance, Complaints, all website content (banners, headlines, facilities, food menu, notices, FAQ, gallery, pages), Settings, Users, Roles, Audit log. ****Missing: only Phase 6B-2** — Socket.IO (live notifications/chat) and WebRTC video/audio meetings. Dashboard shell exists for every role: Overview + Profile & security.

## Authentication completed
Yes (see above). **2FA: not implemented** (architecture left open — Session/User models can take a `twoFactor` block; planned Phase 8).

## Features currently being implemented
None.

## Known bugs
None known — but nothing has been executed against a real database yet. Expect small runtime issues on first run; report them and they get fixed first thing next session.

## Known limitations
- No `npm install` / Vite build / MongoDB run was possible in the build sandbox → only static verification done
- Logo/favicon are URL fields for now (file upload + Cloudinary come with the media library, Phase 5)
- Only `login-history` / `audit-logs` are read-only APIs; no admin UI for users/roles/settings yet (Phase 5)
- No HTML rich-text editor (by decision: markdown-lite only, used for pages AND blog); no PDF reports (CSV only); no image resizing (local storage)
- Resident documents are stored in MongoDB (3 MB cap): watch database size on small plans
- Local upload storage is ephemeral on some hosts (use Cloudinary there); upload behaviour, Cloudinary and CORS for images are untested
- Room photos are URL-based (no upload yet); booking-document upload, notifications (in-app/e-mail) and dues/final settlement at move-out come in Phases 4–6
- Resident document upload/preview/verification (needs the storage provider, Phase 5); no walk-in "Add resident" form (a person registers, requests a room and is moved in)
- Late fees are manual charges (no automatic late-fee calculation); rent is not prorated; no PDF receipts/reports or CSV export yet (Phase 5/7)
- Notifications are in-app only and delivered by 60-second polling (e-mail + real-time push in Phase 6); no due-reminder e-mails until the scheduler exists
- No resident-facing events/calendar or meeting schedule yet (Phase 5/6)
- Pending-request expiry is lazy (runs when rooms/bookings are listed); a scheduled job is added in Phase 7/8
- Gallery is not seeded (needs real photo URLs); image upload arrives with the media library
- Rules/Terms/Privacy seed text is a generic sample, NOT legal advice — edit before going live
- No visitor counter / online-users badge yet (Phase 7); no blog, chatbot, support tickets, meeting booking (later phases)
- Rich text: pages use plain text + light markdown; full editor + sanitizer planned for Phase 5
- No automated API integration tests yet (need a MongoDB test instance); manual checklist in `docs/TESTING.md`
- Rich-text HTML sanitization is introduced with the first rich-content module (Phase 2/5)
- Login history grows forever (no TTL) — deliberate; add retention policy in Phase 8 if wanted

## Remaining tasks
Phases 2–8 as listed in the master prompt.

## NEXT EXACT TASK
1. **(You) Run the full project now.** `npm install` in `server/` and `client/` (dependencies added across phases: multer, node-cron), follow `SETUP_GUIDE.md` end to end, then work through every checklist in `docs/TESTING.md` (Phases 1–8) including the double-booking script. This is the most important remaining task: every phase above was written and only statically checked, never executed.
2. Fix whatever the test pass turns up (report exact errors/steps back for fastest fixes).
3. Only after that: **Phase 6B-2** — Socket.IO (authenticated live notifications replacing polling, support-ticket live chat, active-user presence) and WebRTC audio/video meeting rooms (needs a TURN server; document deployment requirements). This is the one deliberately deferred piece of the original spec.
4. Optional future polish (not required by the spec, ideas only): resident review/feedback module, CSV→PDF reports, image resizing, multi-currency, dark-mode-only theme presets, i18n for admin-authored content.

## Required environment variables
Server: `MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_URL` (required); `BOOKING_HOLD_DAYS, ENABLE_SCHEDULER, STORAGE_PROVIDER, MAX_UPLOAD_MB, SERVER_URL, CLOUDINARY_*, PORT, NODE_ENV, TRUST_PROXY, JWT_ACCESS_EXPIRES_IN, REFRESH_TOKEN_DAYS, COOKIE_SECURE, COOKIE_SAMESITE, LOGIN_MAX_ATTEMPTS, LOGIN_LOCK_MINUTES, REQUIRE_EMAIL_VERIFICATION, EMAIL_*` (optional); `SEED_*` for the seed. Client: `VITE_API_URL`.

## Deployment status
Not deployed. Docs in `SETUP_GUIDE.md` (deployment section is a summary; full guide in Phase 8).

## Testing status
- ✔ `node --check` on all server files
- ✔ TypeScript-parser syntax check on all 110 client files
- ✔ Every static `t('…')` key exists in both EN and BN files (971 keys each)
- ✔ `scripts/check-imports.mjs` — all relative imports/named exports resolve (server + client)
- ✔ 28 unit tests pass (`server/tests`): permission matrix, hierarchy, sanitizer, response helpers, date-window filter, booking transition table, availability rules, resident verification workflow, required-field logic, due status, money rounding, complaint transitions
- ✘ Not yet run: dependency install, server boot, DB connection, seed, any HTTP call, Vite build, browser UI

## Important architectural decisions
See `PROJECT_ARCHITECTURE.md` → "Decisions". Key ones: ESM everywhere; Express 4; Tailwind 3; access token in memory + rotating refresh cookie; roles fixed (6) with editable permissions; identity never taken from the client.

## Unfinished code / TODO
None in source. Deferred by design: 2FA, file uploads, Socket.IO (Phase 6), scheduler (Phase 7/8).
