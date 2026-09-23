# API Documentation (v1.0 — Phases 1–8, excl. 6B-2)

Base URL: `/api/v1` · JSON only · Auth: `Authorization: Bearer <accessToken>` unless "Public".

**Success:** `{ "success": true, "message": "...", "data": ..., "meta": { pagination } }`
**Error:** `{ "success": false, "message": "...", "errors": [{ "field": "email", "message": "..." }], "code": "OPTIONAL_CODE" }`

Common statuses: 400 validation · 401 not authenticated / token expired (`code: TOKEN_EXPIRED`) · 403 forbidden · 404 · 409 duplicate · 429 rate-limited/locked (`code: ACCOUNT_LOCKED`) · 500.
Password policy: 8–128 chars, lower + upper + number.

## Health
| Method | Path | Auth |
|---|---|---|
| GET | `/health` | Public — 200 when DB connected, else 503 |

## Auth (`/auth`)
The refresh token is an HTTP-only cookie (`dhms_refresh`, path `/api/v1/auth`); send requests with credentials.

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/register` | Public | `{name, email, phone?, password}` | Always role `general_user`. 201 → `{user, accessToken}` (or `{user, requiresVerification:true}` if `REQUIRE_EMAIL_VERIFICATION=true`). 409 if e-mail exists |
| POST | `/login` | Public | `{email, password}` | 200 → `{user, accessToken}` + cookie. 401 invalid, 403 inactive / `EMAIL_NOT_VERIFIED`, 429 locked |
| POST | `/refresh` | Cookie | — | Rotates the cookie; 200 → `{user, accessToken}`; 401 if invalid/reused |
| POST | `/logout` | Cookie | — | Revokes the current session |
| POST | `/forgot-password` | Public | `{email}` | Always 200 (no account enumeration) |
| POST | `/reset-password` | Public | `{token, password}` | Ends all sessions |
| POST | `/verify-email` | Public | `{token}` | Token valid 24 h |
| POST | `/resend-verification` | Public | `{email}` | Always 200 |
| GET | `/me` | Any user | — | `{user, permissions[]}` |
| PATCH | `/me` | Any user | `{name?, phone?}` | Role/e-mail cannot be changed here |
| POST | `/change-password` | Any user | `{currentPassword, newPassword}` | Ends other sessions |
| POST | `/logout-all` | Any user | — | Ends every session |
| GET | `/sessions` | Any user | — | Active sessions, `current` flag |
| DELETE | `/sessions/:sessionId` | Any user | — | Own sessions only; not the current one |
| GET | `/login-history` | Any user | — | Last 20 attempts |

## Users (`/users`) — requires `manageUsers`
| Method | Path | Extra permission | Body / query | Notes |
|---|---|---|---|---|
| GET | `/` | — | `page, limit(≤100), search, role, isActive, sort` | Paginated (`meta`) |
| POST | `/` | — | `{name, email, phone?, password, role}` | Role must be below yours (Super Admin: any). Audit: `user.created` |
| GET | `/:id` | — | — | `{user, permissions}` |
| PATCH | `/:id` | — | `{name?, phone?, isActive?}` | Must outrank target; can't deactivate self. Deactivation ends sessions |
| DELETE | `/:id` | — | — | Soft delete; not self |
| PATCH | `/:id/role` | `manageRoles` | `{role}` | Not self; ends target's sessions. Audit: `user.role_changed` |
| PUT | `/:id/permissions` | `manageRoles` | `{permissions: []}` | Extra per-user permissions; you can only grant what you hold |

## Roles (`/roles`)
| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/` | `manageRoles` or `manageUsers` | `{roles[], permissionCatalog[]}` |
| PUT | `/:key/permissions` | `manageRoles` | `{permissions: []}`. `super_admin` immutable (400); can't edit roles ≥ your own level |

## Settings (`/settings`)
| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/public` | Public | Sections: `general, contact, social, location, theme, seo` |
| PUT | `/` | `manageSettings` | Partial update of any subset of those sections; colors must be `#rrggbb`, URLs http(s) |

## Audit logs
| Method | Path | Permission | Query |
|---|---|---|---|
| GET | `/audit-logs` | `viewAuditLogs` | `page, limit, actor, entity, action` (paginated, newest first) |

Audited actions so far: `user.created|updated|role_changed|permissions_changed|deleted`, `role.permissions_changed`, `settings.updated`, `auth.password_changed`.

---
# Phase 2 — Website content

## CMS resources (banners, headlines, facilities, food-menu, notices, faqs, gallery)
Every resource `<r>` exposes the same six endpoints:

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/<r>` | **Public** | Only published items. `Cache-Control: public, max-age=30`. Query: `limit` (+ resource filters below) |
| GET | `/<r>/admin/all` | permission | All items. Query: `page, limit, search, isActive` |
| GET | `/<r>/admin/:id` | permission | One item |
| POST | `/<r>` | permission | Create (body = fields below) → 201 |
| PATCH | `/<r>/:id` | permission | Partial update (≥ 1 field) |
| DELETE | `/<r>/:id` | permission | Hard delete, audit-logged (`<entity>.deleted`) |

| Resource | Permission | Fields (required in **bold**) | Public filters |
|---|---|---|---|
| `banners` | manageBanners | **title**, subtitle, description, imageUrl, videoUrl, ctaText, ctaLink, secondaryCtaText, secondaryCtaLink, order, isActive, startsAt, endsAt | active + date window |
| `headlines` | manageBanners | **text**, link, priority, isActive, startsAt, endsAt | active + date window, highest priority first |
| `facilities` | manageFacilities | **name**, description, icon, imageUrl, hostelType(all/boys/girls), order, isActive | `hostelType` (returns `all` + that type) |
| `food-menu` | manageFoodMenu | **hostelType, day, meal**, items[], description, imageUrl, isSpecial, price, isActive — one entry per (hostelType, day, meal) → 409 if duplicate | `hostelType` |
| `notices` | manageNotices | **title**, body, imageUrl, attachmentUrl, priority(normal/important/urgent), audience(everyone/boys/girls/residents/staff/admins), isPinned, publishAt, expiresAt, isActive | `audience` (boys/girls); public never returns residents/staff/admins notices; only publishAt ≤ now < expiresAt |
| `faqs` | manageFAQ | **question, answer**, category, order, isFeatured, isActive | `category`, `featured=true` |
| `gallery` | manageGallery | **imageUrl**, title, description, category, date, isFeatured, order, isActive | `category`, `featured=true` |

`day`: saturday…friday · `meal`: breakfast, lunch, snack, dinner · gallery `category`: hostel, boys, girls, events, food, educational_tour, functions, sports, facilities.
URL fields accept an `http(s)://` URL or an internal path (`/contact`). Dates are ISO strings; send `null` to clear.

## Pages
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/pages/:key` | Public | `key` ∈ about, boys, girls, rules, terms, privacy. 404 if never saved |
| PUT | `/pages/:key` | `manageRules` **or** `manageSettings` | `{title, content}`. Content = plain text with `## heading`, `- bullet`, `*note*`, `**bold**` |

## Contact
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/contact` | Public, 5/hour/IP | `{name, email, phone?, subject?, message(≥10), website}` — `website` is a honeypot: must be empty |
| GET | `/contact/messages` | `manageSupport` | `page, limit, status` |
| PATCH | `/contact/messages/:id` | `manageSupport` | `{status: new|read|resolved}` |

## Settings additions (`PUT /settings`, `GET /settings/public`)
New sections: `emergency {police, ambulance, fire, hospital, hostelContact}`, `footer {showQuickLinks, copyrightText}`, `location.nearbyLandmarks`, `location.transportInfo`,
`navigation [{key, label, labelBn, path, enabled}]` (array order = menu order; replaces the whole array), `homeSections [{key: hero|headlines|facilities|notices|faq|contact, enabled}]` (order = page order).

Example (Owner/Super Admin token):
```bash
curl -X PUT $API/settings -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"general":{"hostelName":"Green Nest Hostel","address":"House 12, Road 3, Dhaka"},"contact":{"phone":"+8801XXXXXXXXX"}}'
curl -X POST $API/headlines -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"text":"📢 Admissions open","link":"/contact","priority":5}'
```

---
# Phase 3 — Rooms, beds, bookings

**Room fields:** roomNumber, hostelType (boys/girls), floor, roomType (single/double/triple/quad/dormitory), capacity (1–12 beds), price (monthly, **per bed**), description, imageUrls[≤10], videoUrl, sizeSqFt, bathroomType (attached/shared), hasAC/hasWifi/hasBalcony/hasStudyTable/hasWardrobe, bedType (single/bunk), facilities[], status (active/maintenance/inactive).
Derived (read-only): `availableBeds`, `availabilityStatus` = `available | almost_full | fully_booked | maintenance | inactive`.
Public bed states are only `available | booked | maintenance` (reserved vs occupied and who holds a bed are never exposed).

## Rooms (`/rooms`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | Public | Query: `page, limit(≤50), q, hostelType, roomType, floor, capacity, minPrice, maxPrice, ac, attachedBathroom, wifi (true/false), availability (available = has free beds, or an availabilityStatus), sort (price,-price,floor,-floor,capacity,-capacity,newest,roomNumber)`. Excludes archived/inactive rooms |
| GET | `/stats` | Public | `{boys:{rooms,totalBeds,availableBeds,minPrice,maxPrice}, girls:{…}}` (active rooms only) |
| GET | `/:id` | Public | Room + `beds:[{label,status}]` |
| GET | `/favorites`, `/favorites/ids` | Signed in | Own favorite rooms / ids |
| PUT | `/favorites/:roomId` | Signed in | Add (idempotent) |
| DELETE | `/favorites/:roomId` | Signed in | Remove |
| GET | `/admin/all` | `manageRooms` | Adds `status`, `includeArchived` filters |
| GET | `/admin/:id` | `manageRooms` | Room + full beds incl. `status`, `booking`, `occupant{name}` |
| POST | `/` | `manageRooms` | Required: roomNumber, hostelType, floor, roomType, capacity, price. Beds A, B, C… are created automatically. 409 if (hostelType, roomNumber) exists |
| PATCH | `/:id` | `manageRooms` | Partial. Capacity can grow; it can shrink only if the highest-labelled beds are free/maintenance (else 409). Changing hostelType is refused while beds are reserved/occupied |
| DELETE | `/:id` | `manageRooms` | **Archive** (soft). 409 while any bed is reserved/occupied |
| PATCH | `/:id/beds/:bedId/maintenance` | `manageRooms` | `{maintenance: true|false}`; only available ⇄ maintenance beds |

## Bookings (`/bookings`) — signed in
Booking statuses: `pending → approved → moved_in → moved_out`; also `on_hold`, `rejected`, `cancelled`, `expired`. Allowed transitions are enforced server-side (409 `INVALID_TRANSITION`).

| Method | Path | Who | Body / notes |
|---|---|---|---|
| POST | `/` | any signed-in user | `{roomId, fullName, phone, email?, gender(male|female), occupation?, institution?, expectedMoveIn(date, ≤1 yr), notes?}`. Gender must match the hostel. Max **2** active requests per user. Atomically reserves a bed and holds it for `BOOKING_HOLD_DAYS`. Errors: 409 `ROOM_FULL`, `ROOM_UNAVAILABLE`, `DUPLICATE_BOOKING`, `TOO_MANY_BOOKINGS` |
| GET | `/mine` | owner | Own bookings (internal notes hidden) |
| GET | `/:id` | owner or `manageBookings` | Others get 404 |
| POST | `/:id/cancel` | owner or `manageBookings` | `{reason?}` — frees the bed |
| GET | `/` | `manageBookings` | `page, limit, status, hostelType, room, search, sort` |
| POST | `/:id/approve` | `manageBookings` | `{reason?}` pending/on_hold → approved (hold no longer expires) |
| POST | `/:id/reject` | `manageBookings` | `{reason?}` frees the bed; reason is visible to the applicant |
| POST | `/:id/hold` | `manageBookings` | pending → on_hold (bed stays reserved, no auto-expiry) |
| POST | `/:id/notes` | `manageBookings` | `{text}` internal note |
| PATCH | `/:id/bed` | `manageBookings` | `{bedId}` reassign to a free bed of the same hostel type (reserved first, old bed released after) |
| POST | `/:id/check-in` | `manageBookings` | `{date?}` approved → moved_in; bed occupied; occupancy record opened; user role → `hostel_resident` |
| POST | `/:id/check-out` | `manageBookings` | `{date?, reason?}` moved_in → moved_out; bed freed; occupancy closed; role back to `general_user` if no other stay. *Final dues settlement arrives with Phase 4* |

Audit actions: `room.created|updated|archived`, `bed.maintenance_changed`, `booking.requested|approved|rejected|on_hold|cancelled|bed_assigned|moved_in|moved_out`.

---
# Phase 4 — Residents, finance, complaints, warnings, notifications
All endpoints require sign-in. "Resident" = the signed-in user's own record (identity comes from the token, never from the body).

## Residents (`/residents`)
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/me` | resident | `{resident, outstanding, requiredFields[], missingFields[]}` |
| PUT | `/me` | resident | Partial biodata: photoUrl, fatherName, motherName, dateOfBirth, phone, email, emergencyContact{name,phone,relation}, guardian{…}, permanentAddress, presentAddress, nationality, occupation, institution, department, bloodGroup, expectedLeavingDate, notes. Status/room/rent/verification are NOT editable here |
| POST | `/me/acknowledge-rules` | resident | Records the acknowledgement time |
| GET | `/me/notices` | resident | Notices for audience everyone / residents / own hostel |
| POST | `/me/move-out` | resident | `{date, reason?}` → move-out status `requested` (409 if one is in progress or no active stay) |
| GET | `/` | `manageResidents` | `page, limit, status, hostelType, room, moveOut, hasDue, search`; each row has `outstanding` |
| GET | `/:id` | `manageResidents` | Full record + `outstanding` + `missingFields` |
| PATCH | `/:id/verify` | `manageResidents` | `{status: pending|verified|rejected|suspended|archived, note?}`; transitions enforced; `verified` needs a complete profile (409 `PROFILE_INCOMPLETE`) |
| POST | `/:id/transfer` | `manageResidents` | `{bedId, reason}` same hostel type; bed taken atomically; rent = new room price; occupancy history updated |
| POST | `/:id/move-out/decision` | `manageResidents` | `{approve, note?}` → returns `finalOutstanding` |

Required biodata is configured with `PUT /settings` → `residentForm.requiredFields` (any of: photoUrl, fatherName, motherName, dateOfBirth, phone, email, emergencyContact, permanentAddress, presentAddress, nationality, occupation, institution, department, bloodGroup, guardian, expectedLeavingDate). Default: dateOfBirth, emergencyContact, permanentAddress.

`POST /bookings/:id/check-out` now also accepts `acknowledgeOutstanding: true`; without it, unpaid dues → 409 `OUTSTANDING_DUES`.

## Dues (`/dues`) and payments (`/payments`)
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/dues/mine` | resident | Own dues (with `balance`) |
| GET | `/dues/summary` | `managePayments` | `{totalOutstanding, collectedThisMonth, overdueCount}` |
| GET | `/dues` | `managePayments` | `page, limit, status(due|partially_paid|paid|overdue|void), residentId, month, year, type, search` |
| POST | `/dues/generate` | `managePayments` | `{month, year, dueDay(1–28, default 10)}` → `{created, skipped}`; one rent due per resident per month (DB-unique); full monthly rent, no proration |
| POST | `/dues` | `managePayments` | `{residentId, type(rent|late_fee|adjustment|other), month, year, amount, description?, dueDate}` |
| POST | `/dues/:id/void` | `managePayments` | `{reason}`; refused while payments exist (void them first) |
| GET | `/payments/mine` | resident | Own payment history |
| GET | `/payments` | `managePayments` | `page, limit, residentId, method, status, from, to` |
| POST | `/payments` | `managePayments` | `{dueId, amount, method(cash|bkash|nagad|rocket|bank_transfer|other), transactionId?, paidAt?, note?}`; overpayment → 409 `OVERPAYMENT` (checked and applied in one atomic update); returns receipt number |
| POST | `/payments/:id/void` | `managePayments` | `{reason}`; balance is restored, record kept |
No card data or gateway secrets are ever stored. Gateway integration point: `server/src/services/paymentProviders.js`.

## Complaints (`/complaints`)
| Method | Path | Who | Notes |
|---|---|---|---|
| POST | `/` | resident | `{category, subject, description(≥10), priority?}` → code `CMP-XXXXXX` |
| GET | `/mine` | resident | Own (internal notes hidden) |
| GET | `/:id` | owner or `manageComplaints` | Others get 404 |
| POST | `/:id/reply` | owner | `{text}` (not when closed) |
| GET | `/` | `manageComplaints` | `page, limit, status, category, priority, assignedTo, search` |
| POST | `/:id/assign` | `manageComplaints` | `{assigneeId}` must be active staff |
| PATCH | `/:id/status` | `manageComplaints` | open → assigned/in_progress/resolved/closed …; closed is final |
| POST | `/:id/notes` | `manageComplaints` | `{text, internal?}` — public notes notify the resident |

## Warnings (`/warnings`)
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/mine` | resident | Own, excluding withdrawn |
| POST | `/:id/acknowledge` | resident | active → acknowledged |
| GET | `/` | `manageResidents` | `page, limit, status, residentId, severity` |
| POST | `/` | `manageResidents` | `{residentId, type, severity, reason, description?}` — notifies the resident. Never automatic |
| POST | `/:id/close` | `manageResidents` | `{status: resolved|withdrawn, note?}` |

## Notifications (`/notifications`) — own only
`GET /` (`page, limit, unread`; `meta.unreadCount`), `POST /:id/read`, `POST /read-all`.
Types so far: booking.approved/rejected/on_hold/cancelled/moved_in, resident.verified/rejected/suspended/transferred/moved_out, due.created, payment.received/voided, complaint.*, warning.*, moveout.approved/rejected.

Audit actions added: `resident.*`, `due.*`, `payment.recorded|voided`, `complaint.*`, `warning.*`.

---
# Phase 5B — Media, events, analytics overview

## Media (`/media`) — multipart uploads
| Method | Path | Permission | Notes |
|---|---|---|---|
| POST | `/media` | any of manageMedia, manageRooms, manageGallery, manageBanners, manageFacilities, manageFoodMenu, manageNotices, manageEvents | `multipart/form-data`: `file` (required, ≤ `MAX_UPLOAD_MB`), `purpose` (general, banner, gallery, room, facility, food, notice, event, blog, profile), `altText?`. Type is verified from the file bytes (JPEG/PNG/WebP/GIF); others → 400 `UNSUPPORTED_FILE`; too big → 413. Returns `{url, …}` |
| GET | `/media` | same as upload | `page, limit, search, purpose` |
| PATCH | `/media/:id` | `manageMedia` | `{altText?, purpose?}` |
| DELETE | `/media/:id` | `manageMedia` | **Archive** (file stays on storage) |
Local files are served at `GET /uploads/<name>` (public, cacheable). Set `SERVER_URL` when the API sits behind a proxy so links are absolute and correct.

## Events (same CRUD pattern as the other CMS resources, permission `manageEvents`)
`GET /events?when=upcoming|past|all&limit` (public) · `GET /events/admin/all` · `POST /events` · `PATCH /events/:id` · `DELETE /events/:id`
Fields: **title, startsAt**, description, imageUrl, endsAt, location, organizer, registrationLink, status (scheduled|cancelled|completed), isActive.

## Analytics overview
`GET /analytics/overview` (`viewAnalytics`) → `{residents{total,boys,girls}, rooms{total,byStatus}, beds{total,available,occupied,reserved,maintenance,occupancyRate}, bookings{byStatus,pending}, complaints{byStatus,open}, newUsers30Days, finance{totalOutstanding,collectedThisMonth,overdueCount}, monthlyCollection[{label,total}]}`

---
# Phase 5C — Resident documents, exports

## Resident documents (private) — under `/residents`
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/me/documents` | resident | Metadata only (never the bytes) |
| POST | `/me/documents` | resident | `multipart/form-data`: `file` (JPEG/PNG/WebP/PDF ≤ 3 MB), `type` (national_id, student_id, passport, guardian_letter, other), `label?`. Max 10 per resident (409). Wrong type → 400 `UNSUPPORTED_FILE` |
| DELETE | `/me/documents/:docId` | resident | Not allowed once verified (409) |
| GET | `/me/documents/:docId/file` | resident | The file (own only, else 404). `?download=1` forces download |
| GET | `/:id/documents` | `manageResidentDocuments` | Metadata list |
| GET | `/:id/documents/:docId/file` | `manageResidentDocuments` | The file; audit action `resident_document.viewed` |
| PATCH | `/:id/documents/:docId` | `manageResidentDocuments` | `{status: verified|rejected, note?}`; resident is notified |
File responses carry `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'; sandbox`.

## CSV exports
`GET /exports/:type?status&hostelType&from&to` → `text/csv`. Types and required permission: residents (manageResidents), rooms (manageRooms), bookings (manageBookings), dues + payments (managePayments), complaints (manageComplaints), warnings (manageResidents). Unknown type 404, missing permission 403. Audit action `export.downloaded`.

---
# Phase 6A — Support tickets (`/support`)
Ticket fields: code `TKT-XXXXXX`, requester{name,email,phone}, category, subject, priority (low|normal|high|urgent), status (open|in_progress|waiting|resolved|closed), assignedTo, messages[{side: requester|staff, text, internal, at}].

| Method | Path | Who | Notes |
|---|---|---|---|
| POST | `/` | anyone (token optional) | `{category, subject, message(≥10), name?, email?, phone?, website}`; guests must give name + e-mail; `website` is a honeypot. 5/hour/IP. Returns `{ticket, trackingToken}` — the token is present **only for guests and only once** |
| POST | `/track` | anyone | `{code, token}` → ticket (internal notes removed). 404 for a wrong code or key |
| POST | `/track/reply` | anyone | `{code, token, text}`; a reply on a resolved/waiting ticket reopens it |
| GET | `/mine`, `/mine/:id` | signed in | Own tickets |
| POST | `/mine/:id/reply` | signed in | `{text}` |
| GET | `/` | `manageSupport` | `page, limit, status, category, priority, assignedTo, search` |
| GET | `/:id` | `manageSupport` | Full ticket incl. internal notes |
| POST | `/:id/reply` | `manageSupport` | `{text, internal?}` — public replies notify and e-mail the requester |
| POST | `/:id/assign` | `manageSupport` | `{assigneeId}` active staff only |
| PATCH | `/:id/status` | `manageSupport` | transitions enforced (409 `INVALID_TRANSITION`); resolved/closed notify + e-mail |
| PATCH | `/:id/priority` | `manageSupport` | `{priority}` |
E-mail events wired so far: ticket received / reply / resolved-closed, booking approved / rejected, payment receipt, warning issued (all also create in-app notifications).

---
# Phase 6B-1 — Meetings (`/meetings`)
Dates are local calendar strings `YYYY-MM-DD`, times `HH:MM` in the hostel's local time (`utcOffsetMinutes`, default 360). Types: `in_person`, `audio` (phone call), `video` (reserved for the WebRTC step).

| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/config` | public | `{enabled, days[0=Sun], startTime, endTime, slotMinutes, maxPerSlot, maxAdvanceDays, utcOffsetMinutes, blackoutDates[]}` |
| GET | `/availability?date=` | public | `{date, open, slots:[{time, left, bookable}]}` |
| POST | `/` | signed in | `{date, time, type, reason?}` → 201. Errors: 400 `SLOT_UNAVAILABLE` (closed day / blackout / outside hours / < 1 h ahead / too far), 409 `SLOT_FULL`, `DUPLICATE_MEETING`, `TOO_MANY_MEETINGS` (3 upcoming) |
| GET | `/mine` | signed in | Own meetings |
| POST | `/:id/cancel` | owner (before start) or `manageMeetings` | `{reason?}`; frees the place |
| GET | `/` | `manageMeetings` | `page, limit, status, from, to, order` |
| PATCH | `/:id/outcome` | `manageMeetings` | `{status: completed|no_show}` |
Settings: `PUT /settings` → `meetings {enabled, days, startTime, endTime, slotMinutes(10–240), maxPerSlot(1–10), maxAdvanceDays(1–180), utcOffsetMinutes, blackoutDates[]}`.

---
# Phase 7 — Visitor tracking & analytics
| Method | Path | Who | Notes |
|---|---|---|---|
| POST | `/track` | public, 60/min/IP | `{visitorId (16–64 chars [A-Za-z0-9-]), path (starts with /), type: view|ping, referrer?}` → always **204** (also when DNT/GPC is set or the client is a bot; nothing is stored then) |
| GET | `/track/stats` | public | `{onlineNow, today, total, since}` — only the counters enabled in Settings (others are `null`); cached 15 s |
| GET | `/analytics/visitors?days=7..90` | `viewAnalytics` | `{activeNow, today, thisMonth, lifetime, series[{day,visitors,pageviews}], activeByPage[], devices[], referrers[], topPages[]}` |
Settings: `PUT /settings` → `visitorStats {showOnlineNow, showToday, showTotal}`.
A "day" starts at midnight in the hostel's time zone (`meetings.utcOffsetMinutes`).

---
# Phase 8 — Blog, chatbot, SEO

## Blog (`/blog`)
Post fields: title, slug (auto from title if omitted), excerpt, content (markdown-lite), coverImageUrl, category, tags[], status (draft|published|scheduled|archived), publishAt, isFeatured, seoTitle, seoDescription. "Live" = status published/scheduled AND `publishAt <= now` (checked at read time, no job needed).

| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/` | public | `page, limit(≤50), category, tag, q, featured` — live posts only, list view excludes `content` |
| GET | `/categories` | public | `[{name, count}]` over live posts |
| GET | `/:slug` | public | Full post (404 if not live) |
| GET | `/:slug/comments` | public | Visible comments, nested one level (`replies[]`) |
| GET | `/:slug/state` | signed in | `{liked, bookmarked}` |
| POST | `/:slug/like`, `/:slug/bookmark` | signed in | Toggle; idempotent under double-clicks |
| GET | `/mine/bookmarks` | signed in | Saved live posts |
| POST | `/:slug/comments` | signed in, 20/10min | `{text, parent?}` — one level of replies only |
| POST | `/comments/:id/report` | signed in | One report per person; cannot report your own comment |
| DELETE | `/comments/:id` | owner or `manageBlogs` | Soft delete |
| GET | `/admin/all` | `manageBlogs` | `page, limit, status, category, q` |
| GET/POST/PATCH | `/admin/:id`, `/`, `/:id` | `manageBlogs` | Create/update; slug uniqueness enforced |
| DELETE | `/:id` | `manageBlogs` | Archive (soft) |
| GET | `/admin/comments` | `manageBlogs` | `page, limit, status, reported=true` |
| PATCH | `/comments/:id` | `manageBlogs` | `{status: visible|hidden}` |

## Chatbot
`POST /chatbot {message}` (20/min/IP) → `{reply, links:[{label,path}], source: knowledge|faq|ai|fallback}`. Public, no login. Draws only from published site content; never claims to perform an action. Config: `AI_PROVIDER` (none|openai_compatible), `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`.

## SEO
`GET /sitemap.xml`, `GET /robots.txt` — served from the API root (not `/api/v1`), listing the public site's URLs (`CLIENT_URL`). Proxy or redirect these two paths from the frontend host in production if the frontend and API are on different domains.
