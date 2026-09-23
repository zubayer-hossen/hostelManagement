# Changelog

## [1.0.0] — 2026-09-21 — Phase 8: blog, chatbot, SEO, PWA, hardening
### Added
- **Blog:** posts (title, slug, excerpt, markdown-lite content, cover image, category, tags, draft/published/scheduled/archived, SEO title/description, featured); scheduled posts go live automatically at read time (no job needed). Likes, bookmarks ("saved posts"), one level of threaded comments, share links (Facebook, Messenger, WhatsApp, X, LinkedIn, copy link), comment reporting and moderation (approve/hide/delete; reported-first queue); rate-limited commenting; staff screens for posts and comment moderation.
- **24/7 chatbot** with a provider abstraction: built-in knowledge (rooms/prices/availability, facilities, today's food menu, rules sections, contact/location, notices, events, how booking/support/meetings work) drawn only from published data, falling back to the closest FAQ, and an honest hand-off sentence when it cannot help. An optional OpenAI-compatible provider (`AI_PROVIDER=openai_compatible`) may rephrase the same facts; on any failure or when disabled the built-in answer is used unchanged. Bilingual (English/Bangla) by keyword detection. **The bot never claims to book, pay, or change any record.**
- **SEO:** server-rendered `/sitemap.xml` (static pages, live rooms, live blog posts) and `/robots.txt`; per-page `<meta name="description">`, canonical link and Open Graph/Twitter tags, driven by page/blog content with a site-wide fallback from Settings → SEO.
- **PWA:** web manifest, and a minimal service worker that does nothing but show a friendly offline page when a page navigation fails — no caching of API data or app code, so people always get the current version.
- **Security hardening:** a strict default Content-Security-Policy (the API serves no inline scripts), `/uploads` explicitly cross-origin-readable for the SPA, health check excluded from the general rate limit.
### Not yet
- Socket.IO live features and WebRTC audio/video meetings remain the one deliberately deferred piece (Phase 6B-2) — they need a running system and a TURN server to build safely
### Known
- Still not executed against MongoDB / installed dependencies. **This is the last content phase: strongly recommend running the full test suite in `docs/TESTING.md` now.**


## [1.0.0-rc1] — 2026-09-21 — Phase 7: visitor analytics + scheduler
### Added
- **Privacy-first visitor tracking:** the browser sends a random id, the page and the referring *domain* (one "view" per page, one keep-alive "ping" per minute while the tab is visible). **No IP address, cookies, name, e-mail or location is stored.** Bots and scripts are ignored; Do Not Track / Global Privacy Control are respected; account pages are not tracked. Reloading a page does not create a new visitor (one record per visitor per day).
- **Real counters:** online now (active in the last 5 min), unique visitors today (in the hostel's local day), this month, and all-time since tracking began. The homepage badge ("● 24 online now · 1,250 visitors today · 25,400 since …") shows only the counters the admin enables (Settings → Visitor counters). Nothing is invented: with no visitors it shows 0.
- **Admin Analytics screen** (`viewAnalytics`): live "online now" and by-page, daily visitors and page views (7/30/90 days), most viewed pages, devices, referrers; auto-refresh every 30 s.
- **Scheduler (node-cron):** every 15 min expires stale room-request holds and sends **meeting reminders** (24 h before, once); hourly marks overdue dues; daily 09:00 sends **rent-due reminders** (3 days before, then weekly while overdue) by in-app notification + e-mail. Reminders are *claimed* with a conditional update so two server instances can never send the same one. `ENABLE_SCHEDULER=false` turns it off (run it on one instance only). Expiry/scheduling of banners, headlines and notices needs no job: public queries already filter by their dates.
### Fixed
- Settings screen state: the client silently dropped the `meetings` and `residentForm` groups returned by the API, so those editors always showed defaults instead of saved values (introduced in 5A/6B-1). All groups are now kept.
### Decision
- "Active users" uses heartbeats + polling rather than Socket.IO: same numbers, no persistent connections, works on any host. Socket.IO remains planned for live chat/notifications.
### Known
- Still not executed against MongoDB / installed dependencies (new dependency: `node-cron`)


## [0.9.0] — 2026-09-21 — Phase 6B-1: meeting scheduling
### Added
- **Meeting scheduling:** signed-in users book a slot with the manager; the day/time picker only shows open weekdays, non-blackout dates and free times. Managers configure it under Settings → Meetings: enable/disable, available weekdays, opening/closing time, meeting length, **meetings per slot**, how many days ahead, time-zone offset (Bangladesh = +360) and blackout/holiday dates.
- **No overlapping/over-full slots, enforced by the database:** each booking takes a `(slot, seq)` place under a unique index (`seq` ≤ meetings-per-slot), so concurrent requests can never exceed capacity; one person cannot hold two meetings in the same slot; max 3 upcoming meetings per user; the server re-validates day, hours, blackout, ≥ 1 hour lead time and advance window.
- Confirmation in-app + e-mail, staff notification for each booking, cancel by owner (before start) or staff (person notified), staff outcome (completed / did not attend), audit log.
- Client: public **Meet the manager** page, **My meetings**, staff **Meetings** screen, Meetings settings tab; pure slot maths covered by unit tests.
### Decision
- Only **in-person** and **phone call** (the manager calls the number on the account) are offered for now. Video/audio rooms are NOT offered until the WebRTC step exists (no fake features). Meetings already store a secret room token for that step.
### Not yet (Phase 6B-2)
- Socket.IO (live notifications, live support chat, active users), WebRTC audio/video rooms, meeting reminder e-mails (need the scheduler)
### Known
- Still not executed against MongoDB / installed dependencies


## [0.8.0] — 2026-09-20 — Phase 6A: support tickets and transactional e-mail
### Added
- **Support tickets** (public + signed-in): categories (general, room, booking, food, maintenance, payment, complaint, emergency — emergencies start Urgent), priority, status workflow (open → in progress / waiting → resolved → closed, reopen from resolved), assignment to staff, public replies and internal notes. Guests need no account: they receive a ticket code and a one-time **tracking key** (only its hash is stored) to follow up; signed-in users see tickets in their dashboard. Requesters never see internal notes or staff identities.
- Abuse protection: rate-limited creation, honeypot field, rate-limited tracking (guess-resistant 128-bit key, constant-time compare, identical answer for wrong code or key)
- **E-mail service** now sends event mails through one reusable template: ticket received / reply / resolved, booking approved / rejected, payment receipt, warning issued (plus the existing verification / reset / password-changed). Sending is best-effort and never blocks the action; with no SMTP configured mails are printed to the console.
- Staff receive an in-app notification for every new ticket and requester reply (`notifyStaff`)
- Client: public **Support** page (new request + track), **My support tickets**, staff **Support tickets** screen; `optionalAuth` middleware; Support in default navigation
### Not yet (Phase 6B)
- Meeting scheduling, Socket.IO (live notifications, live chat, active users), WebRTC audio/video, due/meeting reminder e-mails (need the scheduler), ticket attachments, SMS
### Known
- Still not executed against MongoDB / installed dependencies


## [0.7.0] — 2026-09-20 — Phase 5C: private documents, CSV export, markdown toolbar
### Added
- **Resident documents (private):** upload (JPEG/PNG/WebP/PDF, ≤ 3 MB, ≤ 10 per resident, type checked from file bytes), list, view, delete (not once verified); staff (`manageResidentDocuments`) can view and verify/reject. Bytes are stored in MongoDB on purpose (never on a public URL or disk; works on ephemeral-disk hosts) and served only through authenticated endpoints with `no-store`, `nosniff` and a sandbox CSP. **Every staff view is written to the audit log.** The resident is notified of a review.
- **CSV export** (`GET /exports/:type`, types: residents, rooms, bookings, dues, payments, complaints, warnings) with the same permission as the matching screen, filters (status, hostelType, from, to), spreadsheet-formula-injection protection, UTF-8 BOM for Excel, 20 000-row cap, audit-logged; "Export CSV" buttons on the Residents, Room requests, Manage rooms, Finance and Complaints screens. Reports deliberately omit addresses, birth dates, guardians and documents.
- **Markdown toolbar** (heading / bold / bullet / note) on the Pages editor
### Decision
- A HTML rich-text editor was NOT added: the site renders admin text as React elements from a small markdown subset, which has no XSS surface. Adding an HTML editor would require a sanitizer dependency and adds risk without a proven need; revisit for the blog (Phase 8 / later) if wanted.
### Known
- Still not executed against MongoDB / installed dependencies


## [0.6.0] — 2026-09-20 — Phase 5B: uploads, media library, events, admin overview
### Added
- **Storage abstraction** (`services/storage`): local disk (`server/uploads`, served from `/uploads`) or Cloudinary (REST, no SDK); `STORAGE_PROVIDER`, `MAX_UPLOAD_MB`, `SERVER_URL`, `CLOUDINARY_*` settings
- **Safe uploads:** memory-only multer with size cap, file type detected from the file's real bytes (JPEG/PNG/WebP/GIF; SVG/HTML/executables rejected regardless of name or claimed MIME), server-generated random file names, orphan cleanup, static serving with `nosniff`
- Media model + API (`/media`: upload, list/search/filter, edit alt text/purpose, archive) and **Media library** screen; reusable image picker (upload or choose) now on banner, facility, food, notice, gallery and event forms and on room images
- **Events:** model, public API (`?when=upcoming|past|all`), public Events page, admin screen, upcoming events on the resident dashboard, "Events" in default navigation
- **Admin overview** on the dashboard for users with `viewAnalytics`: residents (boys/girls), free beds and occupancy, pending requests, open complaints, outstanding / collected money, new accounts, monthly collection chart, requests by status — all from real data (`GET /analytics/overview`)
### Not yet (Phase 5C)
- Resident document upload (private files), rich-text editor + HTML sanitizer, CSV export
### Known
- Still not executed against MongoDB / installed dependencies (new dependency: `multer` — run `npm install` in `server/`)
- No image resizing/optimisation yet (Cloudinary can transform via URL; `sharp` for local storage is a Phase 8 option)


## [0.5.0] — 2026-09-20 — Phase 5A: Admin CMS screens (client-only)
### Added
- Config-driven CMS manager (`constants/cmsResources.js` + `CmsResourcePage`): list / search / paginate / create / edit / delete / one-click activate-deactivate for Homepage banners, Headlines, Facilities, Food menu, Notices, FAQ, Gallery — no server changes (uses the Phase 2 admin endpoints)
- Pages & policies editor (About, Boys, Girls, Rules, Terms, Privacy) with live preview
- Settings screen: General, Contact, Social, Location & map, Emergency, Theme (colors, corner roundness, animations), SEO, Footer, **Navigation editor** (labels EN/BN, order, on/off), **Home sections** (order, on/off), **Resident form** (required biodata fields)
- Users screen (create, edit, activate/deactivate, change role, soft delete; only roles below your own are offered), Roles & permissions matrix, Audit-log viewer
- Sidebar groups (Operations / Website content / System); shared `FieldInput`, `formFields` helpers
### Not in this step (Phase 5B)
- File upload + media library (image fields take links for now), rich-text editor with sanitizer, Events model + screen, dashboard statistic cards and charts, CSV export
### Known
- Still not executed against MongoDB / installed dependencies


## [0.4.0] — 2026-09-19 — Phase 4: Resident management
### Added
- Server models: Resident, Due, Payment, Complaint, Warning, Notification; `residentForm.requiredFields` setting (admin chooses which biodata fields are required; minimal defaults)
- Residents: record created automatically at move-in (re-activated for returning residents); self-service biodata (`/residents/me`), rules acknowledgement, resident notices; staff list/detail, **verification workflow** (pending → verified/rejected, suspend, archive; cannot verify an incomplete profile), **room transfer** (atomic, rent follows the new room, occupancy history), **move-out request → approval → move-out with final balance check**
- Finance: monthly rent generation (idempotent, unique index), manual charges (late fee / adjustment), **atomic overpayment-proof payments**, receipts, **void instead of delete** for dues and payments, staff summary, payment-provider abstraction (manual only for now)
- Complaints (residents create/reply, staff assign/status/notes with internal notes), Warnings (staff-issued only, resident acknowledges, staff resolve/withdraw)
- In-app notifications (booking decisions, dues, payments, warnings, complaints, verification, transfers, move-out) + bell with polling
- Client: resident overview, profile form (required fields marked), rent & payments, warnings, complaints, notification bell; staff screens Residents, Finance, Complaints; outstanding-dues override in move-out
### Changed
- Move-out now refuses to proceed while the resident has unpaid dues unless staff explicitly confirms
### Known
- Still not executed against MongoDB / installed dependencies
- Document upload, e-mail/SMS notifications and real-time push are later phases


## [0.3.0] — 2026-09-19 — Phase 3: Rooms & booking
### Added
- Server: models Room, Bed, Booking, OccupancyRecord, Favorite; room marketplace API (filters, search, sort, pagination, public stats); staff room/bed management (create with auto-generated beds, edit, capacity changes, archive, bed maintenance); booking API (request, my bookings, cancel, staff list/approve/reject/hold/notes/reassign bed/move-in/move-out); favorites API
- **Double-booking prevention:** a bed is reserved with one atomic conditional update (`status:'available'` → `'reserved'`); DB partial unique index prevents two active bookings by the same user for the same room; conditional status transitions prevent two staff members acting on one booking; pending holds expire automatically (`BOOKING_HOLD_DAYS`)
- Move-in makes the user a Hostel Resident (and back to General User at move-out if no other active stay); occupancy history is kept permanently
- Seed: 13 sample rooms with beds; `scripts/double-booking-check.mjs` concurrency test
- Client: rooms marketplace (URL-shareable filters), room detail with bed map and BOOKED / LIMITED AVAILABILITY badges, booking request form, favorites, "My room requests" page, staff pages "Room requests" and "Manage rooms", stats + available rooms on Boys/Girls portals, Rooms in default navigation, reusable Modal / ConfirmDialog / Pagination
### Known
- Still not executed against MongoDB / installed dependencies
- Booking documents upload, e-mail/in-app notifications, dues and final settlement at move-out arrive in Phases 4 and 6


## [0.2.0] — 2026-09-19 — Phase 2: Public website
### Added
- Server: models Banner, Headline, Facility, FoodMenu, Notice, Faq, GalleryItem, PageContent, ContactMessage; generic CRUD service + declarative resource registry (`services/contentResources.js`); public read endpoints (cached 30 s, only active/published/in-window items) and permission-protected admin CRUD for each; pages API (about/boys/girls/rules/terms/privacy); contact form API with rate limit + honeypot
- Site settings extended: navigation, homeSections, footer, emergency contacts, map landmarks/transport
- Seed: sample banners, headlines, facilities, weekly food menu, FAQ, notices, default pages (rules/terms/privacy clearly marked as sample text, not legal advice), default navigation & home sections
- Client: dynamic navbar (EN/BN labels, admin-controlled), footer, homepage with ordered/toggleable sections, hero carousel (image/video/gradient), headline ticker, About, Boys/Girls portals, Facilities, Food menu (weekly, day tabs), Gallery (filters + lightbox), Notices, FAQ (search + categories + accordion), Contact (info, emergency numbers, map + directions, spam-protected form), Rules / Terms / Privacy pages, skeleton/error/empty states, safe text renderer for admin content
### Changed
- Public layout replaced by the full navbar/footer layout; homepage rewritten
### Known
- Content is managed through the API until the admin UI arrives in Phase 5
- Still not executed against MongoDB / installed dependencies


## [0.1.0] — 2026-09-19 — Phase 1: Foundation
### Added
- Monorepo scaffold, `.gitignore`, `.env.example` files
- Server: config validation, MongoDB connection, security middleware, error handling, models (User, Role, Session, LoginHistory, AuditLog, SiteSetting), services, controllers, v1 routes, seed, unit tests
- Auth: register/login/refresh/logout, sessions, login history, password change/reset, e-mail verification, lockout
- RBAC: roles, permissions, hierarchy rules, per-user permission grants, audit logging of admin actions
- Client: Vite + React + Tailwind app, runtime theme, dark mode, EN/BN i18n, auth flows, dashboard shell, profile & security page
- Tooling: `scripts/check-imports.mjs`
- Docs: README, SETUP_GUIDE, PROJECT_ARCHITECTURE, API_DOCUMENTATION, PROJECT_PROGRESS, docs/TESTING.md

### Known
- Not yet executed against MongoDB / installed dependencies (see PROJECT_PROGRESS.md)
