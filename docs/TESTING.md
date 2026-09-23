# Testing

## Automated (no database needed)
`cd server && npm test` — permission matrix, role hierarchy, sanitizer, helpers.

## Phase 1 manual checklist (needs MongoDB) — please tick and report failures
**Boot**
- [ ] `npm run seed` completes; running it twice changes nothing
- [ ] `GET /api/v1/health` → 200 `db: connected`
- [ ] Server refuses to start when `JWT_SECRET` is missing/short

**Auth**
- [ ] Register new user → lands on dashboard as *General User* (try sending `"role":"owner"` in the JSON: still General User)
- [ ] Verification link is printed in the server console → opening it shows "Email verified"; dashboard banner disappears after reload
- [ ] Wrong password 5× → "Try again in 15 minute(s)" (then correct password still blocked until lock ends)
- [ ] Reload page while logged in → still logged in (silent refresh)
- [ ] Login on two browsers → Profile shows 2 sessions; "Log out" on the other one ends it; that browser is logged out on its next request
- [ ] Change password → other session ends, current stays
- [ ] Forgot password → link in console → reset → old sessions ended, can log in with new password
- [ ] Logout button returns to home and reload stays logged out

**RBAC** (use curl/Postman with the access token from `/auth/login`)
- [ ] General User → `GET /api/v1/users` = 403
- [ ] Super Admin → `GET /api/v1/users` = 200 with pagination meta
- [ ] Manager cannot create an Owner (403) and cannot change any role (lacks `manageRoles`)
- [ ] Admin cannot deactivate a Manager (403, lower rank)
- [ ] Super Admin changes a user's role → that user's sessions are revoked
- [ ] `PUT /roles/super_admin/permissions` = 400
- [ ] `GET /api/v1/audit-logs` shows the actions above
- [ ] `PUT /settings` as Admin (lacks `manageSettings`) = 403; as Owner/Super Admin = 200 and changes appear on the site (name, colors) after reload

**UI**
- [ ] Theme switch light/dark/system works and persists
- [ ] Language switch EN ⇄ বাংলা works and persists
- [ ] Mobile width (≈375 px): header, forms, dashboard drawer usable
- [ ] Visiting `/dashboard` while logged out redirects to `/login`, then back after login

## Phase 2 manual checklist (needs MongoDB, after `npm run seed`)
**Public API**
- [ ] `GET /api/v1/facilities`, `/faqs`, `/food-menu`, `/notices`, `/banners`, `/headlines` return seeded data without login
- [ ] `GET /api/v1/pages/rules` returns the rules; `GET /api/v1/pages/about` works
- [ ] `POST /api/v1/banners` without token = 401; as General User = 403; as Admin/Owner = 201
- [ ] Create a headline with `endsAt` in the past → not returned by the public `GET /headlines`
- [ ] Create a notice with `audience:"residents"` → not returned publicly; `audience:"boys"` appears under `?audience=boys` only
- [ ] Creating a second food-menu entry for the same hostelType/day/meal → 409
- [ ] `PATCH` with an unknown field is ignored; `PATCH {}` → 400
- [ ] `PUT /pages/terms` as Admin (has manageRules) works; as Manager = 403
- [ ] `POST /contact` 6× within an hour from one IP → 429 on the 6th; with `website` filled → 201 but nothing stored
- [ ] `GET /contact/messages` as Manager (has manageSupport) works, as General User = 403

**UI**
- [ ] Home: hero, ticker, facilities, notices, FAQ, contact sections render; ticker pauses on hover
- [ ] Change `homeSections` order / `navigation` via `PUT /settings` → site reflects it after reload
- [ ] Navbar: desktop ≥ 1280 px shows links; below that a menu button opens the mobile menu; language switch shows Bangla labels
- [ ] Boys / Girls portal show their facilities & menu; Food menu day tabs + boys/girls filter work
- [ ] Add gallery items via API → grid, category filter, lightbox (Esc, ← →)
- [ ] FAQ search + category chips + accordion keyboard use (Tab / Enter)
- [ ] Contact: form validation messages, success message, map + directions after setting `location` in settings
- [ ] Rules / Terms / Privacy pages show; Terms & Privacy show "last updated"
- [ ] Dark mode and 375 px mobile width look right on every page
- [ ] Stop the API: sections show the error card with a working Retry

## Phase 3 manual checklist (needs MongoDB, after `npm run seed`)
**Rooms**
- [ ] `GET /rooms` returns 12 sample rooms (boys 301 is under maintenance → hidden from `availability=available`); filters by price/type/AC/floor/hostel work; `?q=204` style search works
- [ ] `GET /rooms/stats` returns real counts; the Boys/Girls portals show them
- [ ] `GET /rooms/:id` shows beds as available/booked/maintenance only (no user data)
- [ ] `POST /rooms` as Manager (has manageRooms) = 201 and beds A.. exist; duplicate number = 409
- [ ] Reduce capacity below the number of reserved beds = 409; archive a room with a reserved bed = 409

**Booking flow**
- [ ] Log in as a General User → open a room → "Request this room" → fill form → appears in *My room requests* as Pending; the room's free-bed count drops by 1
- [ ] Gender mismatch (male user, girls room) = 400
- [ ] Same user requests the same room again = 409 `DUPLICATE_BOOKING`; a 3rd active request = 409 `TOO_MANY_BOOKINGS`
- [ ] User cancels → bed returns to the room immediately
- [ ] Book every bed of a room → badge shows **BOOKED**, request button disabled, `POST /bookings` = 409 `ROOM_FULL`; when one bed is left the badge shows **LIMITED AVAILABILITY**
- [ ] **Race test:** `node server/scripts/double-booking-check.mjs <API> <roomId> <tokens…>` on a 1-bed room → PASS (exactly one winner)
- [ ] Staff (Manager/Owner) → *Room requests*: approve, hold, reject (reason visible to the user), reassign bed, add internal note (not visible to the user), move in (user becomes Hostel Resident, dashboard still works), move out (bed free again, role back to General User)
- [ ] Approving an already-rejected booking = 409 `INVALID_TRANSITION`
- [ ] General User calling any staff route = 403; reading someone else's booking = 404
- [ ] Set `BOOKING_HOLD_DAYS=1`, create a request, change its `holdExpiresAt` in MongoDB to the past, list rooms → it becomes Expired and the bed is free

**UI**
- [ ] Filters persist in the URL and survive reload; favorites heart works (redirects to login when signed out)
- [ ] Rooms grid, detail, booking form and the two staff tables are usable at 375 px; dark mode OK; Bangla labels appear

## Phase 4 manual checklist (needs MongoDB)
**Move-in → resident**
- [ ] Book a room as a General User, approve it as Manager, *Move in* → the user becomes Hostel Resident; a `Resident` (status pending) exists; the user gets a "moved in" notification (bell)
- [ ] Log in as that user: Dashboard shows room/bed/rent, "complete your profile" and "accept the rules" banners; sidebar shows Resident profile / Rent & payments / Warnings / Complaints
- [ ] Profile form: required fields (default: date of birth, emergency contact, permanent address) are marked *; saving works; banner disappears when complete
- [ ] `PUT /settings {"residentForm":{"requiredFields":["dateOfBirth","guardian"]}}` (Owner) changes what is required
- [ ] Manager → Residents: cannot **Verify** an incomplete profile (409); after completion Verify works; resident is notified
- [ ] A resident cannot open `/dashboard/manage/residents` (403) and `GET /residents` = 403; a General User has no `/residents/me` (404)

**Finance**
- [ ] Manager/Owner → Finance → *Generate monthly rent* for the current month: one due per active resident; running it again → 0 created, all skipped
- [ ] Record a partial payment → due becomes *Partially paid*, receipt number shown to the resident; paying more than the balance → 409 `OVERPAYMENT`
- [ ] Two simultaneous full payments for the same due (two browser tabs / curl) → only one succeeds
- [ ] Void a payment → balance restored, record kept and marked voided; void a due with payments → refused
- [ ] Resident sees only their own dues/payments; another resident's ids in the URL/API give nothing
- [ ] Add a due dated in the past → shows Overdue after listing

**Complaints / warnings / notifications**
- [ ] Resident submits a complaint → appears for staff; assign to me → status Assigned; add internal note (resident cannot see it) and a public note (resident is notified)
- [ ] Staff issues a warning → resident gets a notification and sees it under Warnings; acknowledge works; staff can resolve/withdraw
- [ ] Bell shows the unread count, opens the item link, "Mark all as read" works

**Transfer & move-out**
- [ ] Residents → Stay tab → transfer to a free bed: old bed free, new bed occupied, rent = new room price, notification sent
- [ ] Resident requests move-out → staff approve (final balance shown) → *Room requests → Move out*: with unpaid dues you get the "still owes" confirmation; after confirming (or paying) the resident becomes Archived, bed is free, user role back to General User

## Phase 5A manual checklist (admin CMS)
- [ ] Sidebar shows *Website content* items only for the permissions you hold: Admin sees banners/headlines/facilities/food/notices/FAQ/gallery/pages but NOT users/roles/settings; Owner sees settings and users but not *Roles*; Super Admin sees everything
- [ ] Typing a CMS URL you lack permission for (e.g. Admin → /dashboard/settings) shows 403
- [ ] Banners: create with title only → appears on the homepage carousel; toggle Active off → disappears; set "Show until" in the past → disappears
- [ ] Headlines, Facilities (icon dropdown), Food menu (duplicate hostel/day/meal → error message), Notices (audience "Residents only" not on the public site, but on the resident dashboard), FAQ, Gallery (needs an image link) all create / edit / delete with a confirmation
- [ ] Pages: edit Rules, the live preview updates, save, then /rules shows the change
- [ ] Settings → General: change the hostel name → navbar/footer/tab title update after save
- [ ] Settings → Theme: change primary color and roundness → the whole site follows; invalid color is rejected
- [ ] Settings → Navigation: reorder, hide an item, add a Bangla label → navbar updates; a path such as `about` (no slash) blocks saving
- [ ] Settings → Home sections: move FAQ above Notices, disable Contact → homepage follows
- [ ] Settings → Resident form: require *guardian* → residents' "missing fields" list changes
- [ ] Users: create a Manager as Super Admin; as Owner the role list contains no Owner/Super Admin; cannot delete yourself; deactivated user cannot log in
- [ ] Roles: Super Admin locked; removing a permission from Manager takes effect within ~1 minute (role cache) for that role's users
- [ ] Audit log shows the actions above with actor, item and IP; filters work

## Phase 5B manual checklist
- [ ] `cd server && npm install` (adds `multer`); server boots; `server/uploads/` is created on first upload (and is git-ignored)
- [ ] Media library: upload a JPG/PNG → appears; edit alt text; copy link opens the image in a new tab; archive hides it (an existing banner using it still shows)
- [ ] Upload a `.txt` renamed to `.png`, an `.svg`, and a > 5 MB image → each is rejected with a clear message
- [ ] Banner / facility / notice / gallery / event / food forms: "Choose or upload image" fills the link and shows a preview; room form: chosen image is appended to the image list
- [ ] Images load on the public site when the frontend runs on a different port/domain than the API (`Cross-Origin-Resource-Policy`), and `SERVER_URL` is correct behind a proxy
- [ ] With `STORAGE_PROVIDER=cloudinary` and valid keys the upload returns an `https://res.cloudinary.com/…` link; with missing keys the server refuses to start with a clear message
- [ ] Events: create an upcoming and a past event in the admin → `/events` shows them under the right tabs; cancelled events show no register button; resident dashboard lists upcoming events
- [ ] Owner/Manager dashboard shows the Overview cards; numbers match Residents / Rooms / Finance screens; a General User does not see it (`GET /analytics/overview` = 403)

## Phase 5C manual checklist
**Documents**
- [ ] Resident → Profile → *My documents*: upload a PDF and a JPG; a `.txt`/`.svg`/`.exe` (even renamed) and a > 3 MB file are rejected; 11th file is refused
- [ ] *View* opens the file in a new tab; the URL is a temporary `blob:` link, and requesting `/api/v1/residents/me/documents/<id>/file` without a token gives 401
- [ ] Another resident's document id in that URL gives 404
- [ ] Manager → Residents → *Documents* tab: can view and verify/reject; Admin (no `manageResidentDocuments`) gets 403 on `/residents/:id/documents`
- [ ] Audit log shows `resident_document.viewed` for each staff view; resident gets a notification on review; a verified document cannot be deleted by the resident
**CSV**
- [ ] *Export CSV* on Residents, Room requests, Manage rooms, Finance (dues and payments tabs) and Complaints downloads a file that opens in Excel with correct Bangla text; filters (status/hostel) are respected
- [ ] A cell starting with `=` (e.g. a resident named `=1+1`) appears as text, not a formula
- [ ] Admin role (no manageResidents) → `GET /exports/residents` = 403; unknown type = 404; each download appears in the audit log
**Editor**
- [ ] Pages editor toolbar inserts `##`, `**bold**`, `- ` and `*note*` at the cursor/selection and the preview updates

## Phase 6A manual checklist
- [ ] Signed out → `/support` → New request (name, e-mail, category, subject, message) → shows a ticket code and a 32-character tracking key; the same info appears in the server console (dev e-mail)
- [ ] *Track a request* with code + key shows the thread; a wrong key or wrong code gives the same "no ticket matches" message; 41 quick attempts → 429
- [ ] Guest reply appears for staff; reply on a resolved ticket reopens it
- [ ] Signed in → Support → ticket is linked to the account, appears in *My support tickets*; another user cannot open it (404)
- [ ] Category *Emergency* → priority Urgent and a warning banner is shown
- [ ] Manager (has `manageSupport`) gets a bell notification for each new ticket; *Support tickets* screen: assign to me, change priority, status transitions (closed cannot reopen), public reply (requester gets an e-mail/console mail + notification) and internal note (requester never sees it)
- [ ] Admin/Owner roles: Admin has `manageSupport` by default, General User gets 403 on `GET /support`
- [ ] Booking approve/reject, payment recorded and warning issued each send an e-mail (console) in addition to the bell notification
- [ ] Honeypot: filling the hidden `website` field creates nothing

## Phase 6B-1 manual checklist (meetings)
- [ ] Settings → Meetings: defaults Sun–Thu 10:00–17:00, 30-min slots, 1 per slot, +360 offset; save works; invalid times (end before start) are rejected
- [ ] `/meetings` (signed in): only open weekdays/non-blackout dates appear; slots in the past or < 1 h ahead are greyed out; booking shows in *My meetings*, a confirmation e-mail (console) and a bell notification arrive; Manager gets a bell notification
- [ ] With `maxPerSlot = 1`, two users booking the same slot at the same time → one 201, one 409 `SLOT_FULL`; with `maxPerSlot = 2` two succeed and the third fails
- [ ] Same user, same slot twice → 409; 4th upcoming meeting → 409
- [ ] Add tomorrow to blackout dates → tomorrow disappears from the picker and `POST /meetings` for it is 400
- [ ] User cancels → slot reopens; staff cancels with a reason → user notified; cannot cancel a started meeting as the user
- [ ] Staff → Meetings: mark completed / did not attend; General User gets 403 on `GET /meetings`
- [ ] Signed out → `/meetings` shows the availability but asks to log in; video is not offered

## Phase 7 manual checklist
**Tracking**
- [ ] `cd server && npm install` (adds `node-cron`); server log shows `[jobs] scheduler started (4 jobs)`
- [ ] Open the public site in two different browsers → Analytics shows *Online now = 2*; reloading a page does not add a visitor, only page views; closing a tab → drops out of "online" after ~5 min
- [ ] Browser with Do Not Track on (or Global Privacy Control) → nothing is recorded; `/dashboard` and `/login` are never tracked
- [ ] `curl -A "Googlebot" -X POST …/track` (valid body) → 204 but no record; MongoDB `visitors` documents contain no IP address
- [ ] Homepage badge shows real numbers; switching a counter off in Settings → Visitor counters hides it within ~15 s
- [ ] Analytics screen: charts, most viewed pages, devices, referrers (open the site from a link on another domain); 7/30/90-day ranges; a General User gets 403 on `GET /analytics/visitors`
**Scheduler / reminders**
- [ ] Create a rent due dated tomorrow and run `node -e "import('./src/jobs/index.js').then(m=>m.sendDueReminders())"` (with env loaded) → the resident gets a bell notification + e-mail; running it again sends nothing; a due 8 days overdue with a reminder 8 days ago is reminded again
- [ ] Book a meeting starting in < 24 h, run `sendMeetingReminders()` → one reminder; the second run sends none
- [ ] Set `ENABLE_SCHEDULER=false` → log says the scheduler is disabled
**Settings fix**
- [ ] Settings → Meetings and → Resident form now show the values you saved (after a page reload)

## Phase 8 manual checklist
**Blog**
- [ ] Create a post (status published) → appears on `/blog` and at `/blog/<slug>`; same title twice → different slugs (`-2`, `-3`, …)
- [ ] Create a scheduled post with a future `publishAt` → hidden until that time (no restart needed — just wait or move the clock forward in a test)
- [ ] Signed-in user: like (count updates, double-click stays at 1), bookmark (appears in *Saved posts*), comment, reply to a comment (only one level deep), share menu opens each network with the right link, copy link works
- [ ] Report a comment (not your own; your own is refused) → appears in staff *Comment moderation* reported queue; hide/approve/delete work; hidden comment's reply is unaffected but the count updates correctly
- [ ] Signed out: can read and like buttons prompt to log in; commenting is blocked with a clear message
- [ ] Archive a post → disappears from `/blog` immediately
**Chatbot**
- [ ] Ask about price/rooms, food, facilities, rules, contact, booking, support, meetings, notices, events in English and in Bangla → sensible answers drawn from your real published data (edit a fact in the CMS and ask again — the answer changes)
- [ ] Ask something off-topic (or with `AI_PROVIDER=none` and no matching FAQ) → the exact hand-off sentence, with Support/Meetings buttons; the bot never says it booked/paid/changed anything
- [ ] With `AI_PROVIDER=openai_compatible` and a valid key, answers are phrased more naturally but stay factually consistent with the same data; an invalid key or timeout falls back to the built-in answer, not an error
- [ ] 21 messages within a minute → rate-limited
**SEO / PWA**
- [ ] `GET /sitemap.xml` and `/robots.txt` return valid XML/text with your `CLIENT_URL`; a blog post and a room appear in the sitemap
- [ ] View source on a blog post shows a description meta tag and Open Graph tags matching the post
- [ ] Installing the site (browser's "Install app") works; going offline and reloading a previously visited page shows the offline page, not a browser error
**Hardening**
- [ ] Response headers include a Content-Security-Policy; an uploaded image still loads when the frontend is on a different port/domain
- [ ] `/api/v1/health` still responds during a burst that would otherwise hit the rate limit
