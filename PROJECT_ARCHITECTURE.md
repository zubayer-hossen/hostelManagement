# Architecture

## Stack
MongoDB + Mongoose 8 · Express 4 · Node ≥ 18.18 (ESM) · React 18 + Vite 5 · Tailwind 3 · Framer Motion · i18next · Zod (server + client) · react-hook-form.

## Repository layout
```
digital-hostel-management/
├── client/                    React SPA
│   ├── public/                favicon, _redirects (Netlify SPA fallback)
│   └── src/
│       ├── api/               axios client (token store, single-flight refresh), per-resource API modules
│       ├── components/ui/     Button, Input, PasswordInput, Badge, Alert, Spinner, PageLoader
│       ├── components/        BrandMark, ThemeSwitcher, LanguageSwitcher, ErrorBoundary
│       ├── constants/         roles (UI mirror), dashboard navigation
│       ├── context/           SettingsContext (public settings + theme vars), ThemeContext (light/dark/system), AuthContext
│       ├── i18n/ locales/     i18next setup; locales/en|bn/translation.json
│       ├── layouts/           PublicLayout, AuthLayout, DashboardLayout
│       ├── pages/             Home, auth/*, dashboard/*, 403/404
│       ├── routes/            AppRoutes (lazy), ProtectedRoute, GuestRoute
│       ├── utils/ validations/
├── server/
│   ├── src/
│   │   ├── config/            env (Zod-validated, fail-fast), db
│   │   ├── constants/         roles, permissions (+ default role matrix)
│   │   ├── controllers/       thin HTTP layer
│   │   ├── services/          business logic (auth, session, user, role, permission, settings, email, audit)
│   │   ├── models/            Mongoose schemas
│   │   ├── middleware/        auth (authenticate/requirePermission/…), validate, sanitize, rateLimiter, verifyOrigin, errorHandler
│   │   ├── routes/v1/         one router per resource
│   │   ├── validations/       Zod schemas
│   │   ├── seed/              npm run seed
│   │   └── utils/
│   └── tests/                 node:test unit tests
├── scripts/check-imports.mjs  static import/export checker (server + client)
└── docs/
```
Request flow: `route → (rateLimiter) → authenticate → requirePermission → validate → controller → service → model`.

## Decisions
1. **Identity is never client-supplied.** Access token holds only `sub` + `sid`. Role, active flag and permissions are loaded from MongoDB on every request; the session must be un-revoked. So deactivation, role changes and logout are effective immediately.
2. **Tokens.** Access JWT (15 min) is kept in memory by the SPA. Refresh JWT (7 d) is an HTTP-only cookie scoped to `/api/v1/auth`; only the SHA-256 of its `jti` is stored. Every refresh rotates it; presenting an old one outside a 10 s grace revokes the session (theft detection). `verifyOrigin` adds an Origin check on cookie endpoints.
3. **Roles are fixed, permissions are editable.** Six system roles (levels: super_admin 100, owner 80, manager 60, admin 50, hostel_resident 10, general_user 5). `Role` documents hold each role's permission list (seeded from `DEFAULT_ROLE_PERMISSIONS`; 60 s in-memory cache). Custom roles were skipped to keep the model simple. Super Admin always has every permission.
4. **Anti-escalation rules.** You can manage a user only if you outrank them; assign only roles below your own; grant only permissions you hold; nobody edits their own role/permissions; Super Admin permissions are immutable.
5. **Extra permissions added beyond the prompt list:** manageFacilities, manageEvents, manageSupport, manageRules, manageMedia, manageReviews, manageResidentDocuments, viewAuditLogs.
6. **Indexes** are declared only with `schema.index()` (never `index:true`/`unique:true` on paths). `autoIndex` is on in development; production builds indexes via `npm run seed` (`syncIndexes`).
7. **Soft delete** for users (`deletedAt`); audit log for admin actions; sessions auto-expire through a TTL index.
8. **Theme & branding** are data: colors/radius/animation preference live in `SiteSetting.theme`; the client turns one hex color into a 10-step palette at runtime (CSS variables) so Tailwind classes such as `bg-primary-600` follow the admin's choice. Visitors' own light/dark choice overrides the admin default.
9. **Dev proxy.** Vite proxies `/api` to Express so the browser sees one origin (cookies just work). Production cross-site deploys need `COOKIE_SAMESITE=none` + `COOKIE_SECURE=true`.
10. **Email** never blocks a request: failures are logged. With no SMTP configured (dev), messages are printed to the server console.
11. **Validation** is Zod on both sides; the server replaces `req.body/query/params` with the parsed result, so undeclared fields (e.g. `role`) are dropped.
12. Express 4 (not 5) and Tailwind 3 (not 4) chosen for stability of the ecosystem used here.

## Planned (later phases)
Socket.IO (Phase 6, attach to the HTTP server in `server.js`), scheduler with `node-cron` (Phase 7/8), storage-provider abstraction + Cloudinary (Phase 5), payment & chatbot provider abstractions (Phases 4/6).

## Phase 2 additions
- **Declarative CMS resources.** `server/src/services/contentResources.js` lists each simple resource (model, permission, Zod schema, public filter/sort, admin search fields). `routes/v1/content.routes.js` generates the routes from it, `crudService` + `contentController` implement them. New simple content types = model + schema + one registry entry.
- **Publishing rules live on the server.** Public endpoints filter by `isActive` and date windows; resident/staff-only notices never leave the public API. Admin endpoints require the resource's permission.
- **Navigation & homepage layout are settings**, not code: `SiteSetting.navigation` / `homeSections`. If unset, the client uses `constants/site.js` defaults, which only list pages that exist.
- **Rich content without HTML.** Pages/notices are plain text with a tiny markdown subset rendered by `RichText` into React elements → no XSS surface. A full rich-text editor + HTML sanitizer is deferred to the admin CMS phase.
- **Contact form abuse protection:** per-IP rate limit (5/h), honeypot field, Zod validation, length limits.
- **Client data loading:** `useFetch` hook + `DataState` (skeleton / error+retry / empty) used by every public section.
- **Content language:** UI text is translated (EN/BN); admin-authored content is single-language, except navigation labels which have `label` + `labelBn`.
- **Deletion:** simple CMS content is hard-deleted (audit-logged). Residents, users, financial and booking records keep soft-delete/void semantics in later phases.

## Phase 3 — Booking architecture (the important part)
**Bed is the unit of booking.** A room has N `Bed` documents (A, B, C…). Availability shown on cards is derived from beds.

**Double-booking prevention, layered:**
1. *Atomic reservation.* `reserveBed()` = `Bed.findOneAndUpdate({room, status:'available'}, {status:'reserved', booking:<id>})`. MongoDB applies a single-document update atomically, so two simultaneous requests can never receive the same bed; the loser gets `null` → 409 `ROOM_FULL`. No transaction (and therefore no replica set) is needed. The booking id is generated *before* reserving, so the bed already points to its booking.
2. *Compensation.* If saving the Booking fails after reserving, the bed is released (`releaseBed` only frees a bed that still belongs to that booking).
3. *DB uniqueness.* Partial unique index `{user, room}` where `isActiveHold = true`: one active booking per user per room, even under double-clicks.
4. *Conditional status transitions.* `Booking.updateOne({_id, status: <status we read>}, …)` — two staff members clicking at once cannot both approve/reject; the second gets 409 `STALE_BOOKING`.
5. *Frontend availability is never trusted:* the server re-checks room status, gender rule, active-request limit and bed availability on every request.

**Counters are derived, not incremented.** `Room.availableBeds/availabilityStatus` are recomputed from the Bed collection by `syncRoomCounts()` after every change, so drift heals itself.

**Holds expire lazily.** PENDING requests keep their bed for `BOOKING_HOLD_DAYS` (default 3). `expireStaleBookings()` runs (throttled to once a minute) whenever rooms/bookings are listed or a booking is made, so no scheduler is required; a cron job will also call it in Phase 7/8. On-hold and approved bookings never expire automatically.

**Privacy:** public endpoints show beds only as available / booked / maintenance. Applicants never see internal notes or who decided.

**Occupancy history** (`OccupancyRecord`) is append-only: who slept in which bed and when. Rooms are archived, never deleted; bookings are never deleted.

**Roles follow residency:** move-in promotes General User → Hostel Resident; move-out demotes when no other active stay exists. Staff roles are never changed by this flow.

**Test it:** `server/scripts/double-booking-check.mjs` fires simultaneous requests from several users at one room and checks that exactly as many succeed as there are free beds.

## Phase 4 — Residents & money
- **Resident record is created by move-in**, not by self-registration: staff approve a booking, then move-in creates (or re-activates) the `Resident` (status *pending*), promotes the user to Hostel Resident and opens occupancy history. The resident completes biodata; staff verify. Ex-residents keep their record (archived) and their history.
- **Configurable biodata** lives in `SiteSetting.residentForm.requiredFields`; `profileCompleted` is recomputed on every save and gates verification. Defaults collect the minimum. National ID / document numbers are deliberately **not** collected; document upload waits for the storage-provider work in Phase 5.
- **Money rules.** Dues and payments are never deleted — *void* with a reason. Payments are applied with one conditional update (`paidAmount + amount ≤ amount`) so concurrent payments cannot overpay; if saving the receipt fails the increment is rolled back. Rent generation is idempotent through a partial unique index `{resident, type:'rent', month, year}` where `isVoid=false`. Amounts are rounded to 2 decimals (`utils/money.js`). Overdue is applied lazily (`markOverdue`) and by the Phase 7/8 scheduler.
- **Move-out settlement.** Resident requests → staff approve/decline → staff "move out" in Room requests. The move-out is refused while dues are outstanding unless staff confirm; the resident becomes *archived*, the bed is released, the occupancy record is closed.
- **Transfers** occupy the new bed atomically first, then free the old one; the booking, resident, rent and occupancy history follow.
- **Warnings are human decisions.** Nothing computes or issues them automatically (the spec's "no algorithmic punishment").
- **Privacy.** Resident biodata: the resident + `manageResidents`. Money: the resident (own) + `managePayments`. Complaints: owner + `manageComplaints`, internal notes never sent to residents. Public endpoints never return any of this.
- **Notifications** are written by `notify()` (never throws). Delivery is polling (60 s) until Socket.IO in Phase 6; e-mail templates come with the communication phase.
- **Payment gateway seam:** `paymentProviders.js` (manual only).

## Phase 5A — Admin CMS
- **Screens are data.** `client/src/constants/cmsResources.js` declares each CMS resource's columns and form fields; one generic `CmsResourcePage` renders list, search, pagination, create/edit form, active toggle and delete for all of them. The matching server side is `services/contentResources.js` (Phase 2). Adding a content type = a server registry entry + a client config entry.
- **Permissions are still enforced by the API.** The client only hides menu items (`permission` on navigation entries) and shows 403 pages; every write is authorised again on the server (e.g. Admin can edit FAQs but gets 403 on settings).
- **Settings editor** saves one section at a time (`PUT /settings {section: …}`); arrays (navigation, home sections) are replaced whole. After a save the public settings are reloaded, so theme/navigation changes apply immediately.
- **Anti-escalation in the UI mirrors the server:** users can only be given roles below the acting user's level, permission checkboxes the actor does not hold are disabled, Super Admin is locked. The server rejects violations regardless.
- **Forms** use module-level input components (no inner component definitions), which keeps focus while typing.

## Phase 5B — Uploads, events, overview
- **Never trust the upload.** multer keeps the file in memory under a size cap; `utils/imageSniff.js` decides the type from magic bytes (the client's MIME type and file name are ignored, SVG is refused because it can carry scripts); the stored name is random. The static `/uploads` route is directory-listing-free, `nosniff`, immutable-cached and cross-origin readable so the SPA on another domain can show images.
- **Provider seam.** `services/storage/index.js` picks `local` or `cloudinary` from `STORAGE_PROVIDER`; adding S3 etc. means one more provider with `save()` / `remove()`. Local storage is disk on the API server — on hosts with ephemeral disks (Render/Railway free tiers) use Cloudinary.
- **Archive, don't delete:** media is archived (hidden from the library) because the URL may still be referenced by banners, rooms or notices.
- **Any content manager can upload**, but only `manageMedia` may edit or archive library items.
- **Overview numbers are computed on request** with aggregates (no fabricated statistics). Visitor/online-user analytics are a separate Phase 7 concern.

## Phase 5C — Private documents & exports
- **Documents live in MongoDB deliberately** (`ResidentDocument.data`, `select:false`): small capped files, no public URL/disk, portable to hosts with ephemeral disks, covered by database backups. Trade-off: keep files small (3 MB cap) and mind the database size (Atlas free tier = 512 MB). If volumes grow, move bytes to private object storage behind the same endpoints.
- **Access is only via authenticated endpoints**, ownership/permission checked on the server; staff views are audit-logged; responses are `no-store`, `nosniff` and sandboxed.
- **Exports** are streamed row by row from a Mongo cursor (no big in-memory arrays), permission-checked per report, and free of sensitive personal fields. Cells beginning with `= + - @` are neutralised against CSV/formula injection.
- **Admin text stays markdown-lite** (rendered to React elements, never HTML); the toolbar only inserts markers.

## Phase 6A — Support & e-mail
- **Guest tickets without accounts.** A guest ticket carries a random 128-bit tracking key shown once (and e-mailed); only `sha256(key)` is stored, compared in constant time; wrong code and wrong key give the same 404. Signed-in tickets are bound to the account instead (`optionalAuth` reads the token if present, never errors).
- **Two views of a ticket.** `forRequester()` strips internal notes, staff identities and the assignee; staff endpoints return everything. Ownership is enforced in the service, not the route.
- **Notifications + e-mail in one call.** `notify(userId, payload, { email: true })` writes the in-app notification and sends a templated mail (`sendEventEmail`); failures are logged and swallowed. `notifyStaff(permission, payload)` fans out to active staff who hold a permission.
- **Still console-only without SMTP** (`EMAIL_HOST` empty). For production configure an SMTP provider (see `SETUP_GUIDE.md`).

## Phase 6B-1 — Meetings
- **Capacity by unique index.** A booking inserts `(slotKey, seq)` for seq = 1…maxPerSlot; the partial unique index (`isActive: true`) makes the database refuse the (max+1)-th booking, so no transaction or lock is needed. Cancelling/closing a meeting sets `isActive:false`, freeing its place.
- **Local time without a library.** Slots are calendar strings in hostel-local time; the real instant is `local − utcOffsetMinutes` (Bangladesh has no daylight saving). For a region with DST, replace `utils/slots.js` with a time-zone library. The slot maths is pure and unit-tested (`tests/slots.test.js`).
- **Honest scope.** Video/audio rooms need WebRTC + Socket.IO + a TURN server; until then only in-person and phone-call meetings are bookable. Each meeting already carries a secret `roomToken` (never returned) for that step.

## Phase 7 — Analytics & scheduler
- **Anonymous by construction.** `Visitor` = one row per (random browser id, local day): first/last seen, page views, last path, device class, browser family, referrer *host*. `VisitorLifetime` = random ids + first-seen date (for the all-time count). No IP, no user link, no location. Deleting old `Visitor` rows is safe at any time (retention is a policy choice; the daily rows are the aggregation).
- **Reload ≠ new visitor:** uniqueness is per id per day; page reloads only add page views. Different browsers/devices count separately (there is no cross-device identity by design).
- **Online now** = distinct visitors seen in the last 5 minutes (heartbeat every 60 s while the tab is visible). Upgrading to Socket.IO presence later does not change the API.
- **Jobs run in-process** (`jobs/index.js`, node-cron). Each reminder is claimed with `updateOne({_id, lastReminderAt|reminderSentAt: <old value>})` before sending, so duplicate instances or overlapping runs cannot double-send. Decision logic (`utils/reminders.js`, `utils/slots.js`) is pure and unit-tested. Serverless hosts (no long-lived process) cannot run the scheduler: use a VPS/Render/Railway web service, or trigger the exported job functions from an external cron.

## Phase 8 — Blog, chatbot, SEO, PWA
- **Scheduled/expiring content needs no job**, here or anywhere else in the app: every public query filters by its own dates at read time (`liveFilter()` for blog, `activeWindow()` for banners/notices/events). The scheduler (Phase 7) only handles things an announcement can't do for itself — reminders, holds, overdue marking.
- **Chatbot is a knowledge lookup, not an agent.** `services/chatbot/index.js` maps a detected intent (or best-matching FAQ) to facts pulled from the same public collections the website already reads, then renders a plain-language answer; an optional AI provider only rephrases those facts, never invents new ones, and a failure/timeout (8s) silently falls back to the built-in text. The system prompt and the code both forbid claiming to book, pay, or change a record — the hand-off sentence is fixed text, not model output, so it can't be talked out of it.
- **Comment moderation before automation.** Reporting increments a counter and surfaces the comment to staff; nothing is auto-hidden. One report per person per comment (unique index) stops a single person inflating the queue.
- **SEO lives at the API root**, not under `/api/v1`, because a sitemap/robots.txt is conventionally at the site's domain root; where the frontend is a separate static host, proxy those two paths to the API.
- **The service worker adds resilience, not caching.** It intercepts only failed page navigations and shows a static offline page; it never serves a stale version of the app or intercepts API/data requests, so there is no cache-invalidation problem to manage.
- **CSP** assumes no inline `<script>`/`<style>` is ever added to server-rendered responses (there are none); if a future feature needs one, use a nonce rather than loosening the policy.
