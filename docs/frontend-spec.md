# Booker Platform – Frontend Specification

A web UI on top of the existing Booker API, so a single application serves both the **Playwright UI** and **Playwright API** trainings.

Status: draft · Owner: Ghislain · Replaces: `Ghislain89/PlaywrightWorkshop` (Next.js todo app) and `Ghislain89/playwright-api-assignment`

Decided: local-only (no hosted copy for participants); new repo `booker-platform`.

---

## 1. Goals

1. One domain (hotel room booking) for UI tests, API tests and hybrid (API + UI) tests.
2. Cover every topic in the current Playwright workshop **plus** the topics the todo app cannot support (dialogs, iframes, files, drag & drop, multi-context, clock, emulation).
3. Deterministic and isolated by design: tests may be flaky only when a trainer *chooses* that (bug/chaos mode).
4. Setup in one command, Node only: `npm install && npm run dev` → UI + API + Swagger on `http://localhost:3000`.
5. Backward compatible with the existing API assignment (`playwright/tests/assignment*.spec.ts` on `main` and `solutions`).

### Non-goals

- Production-grade security (but no *accidental* security bugs either – see §4).
- Server-side rendering, SEO, real payments, real e-mail.
- Component testing (out of scope for the workshop).

---

## 2. Testability principles

| Principle | Rule |
|---|---|
| Accessible first | Every interactive element has a role + accessible name (visible `<label>`, button text). `getByRole` / `getByLabel` must work everywhere. No clickable `div`/`span`, no `<button>` inside `<a>`. |
| Test ids sparingly | `data-testid` only where no user-facing locator exists (e.g. list rows, charts). Convention: `kebab-case`. |
| Visible network | SPA + REST: every action is an observable `fetch` to `/api/*` (good for `waitForResponse`, `route`, HAR). |
| Explicit states | Loading, empty, error and success states are rendered and announced (`role="status"` / `role="alert"`). Toasts stay until dismissed in test mode. |
| Deterministic mode | `?test=1` or cookie `booker-test=1`: animations off, fixed "deal of the day", no random content. Clock-based features use `Date.now()` so `page.clock` works. |
| Isolation | Seed/reset API (§5) and per-worker namespaced data so `fullyParallel: true` works. |
| No hidden waits | No `setTimeout`-based UI logic except the deliberate chaos features. |

---

## 3. Architecture

```
booker-platform/
├── src/                 # existing Express API (unchanged structure)
├── web/                 # NEW – Vite + React + TypeScript SPA
│   ├── src/pages/…
│   ├── src/components/…
│   └── src/api/client.ts    # typed fetch wrapper (orval-generated client is an option)
├── prisma/
├── playwright/
│   ├── tests/api/…      # existing API assignments
│   └── tests/ui/…       # NEW UI assignments
└── package.json         # scripts: setup (db reset + seed), dev (api + web), build, start, test, lint
```

- **Frontend:** Vite, React 19, React Router, TanStack Query, plain CSS or Tailwind. No Next.js (keeps network calls explicit; fewer framework abstractions to explain).
- **Serving:** in dev, Vite proxies `/api` to Express; in `start`, Express serves `web/dist` – **one port (3000)** for UI, `/api`, `/api-docs`.
- **Auth:** existing JWT. Stored in `localStorage` (`booker.token`) → captured by `storageState`, sent as `Authorization: Bearer`. Teaching point: compare with cookie-based auth.
- **Live updates:** Server-Sent Events endpoint `GET /api/events` (booking status changes, new messages).
- **Uploads:** `multer` → `uploads/` served statically; max 2 MB, images only.
- **Playwright config:** projects `api`, `setup`, `ui-guest`, `ui-admin`, `mobile`; `webServer` runs `npm run start`.

---

## 4. Required API changes (backward compatible)

Findings from reviewing the current API, and what the UI needs.

| # | Type | Change |
|---|---|---|
| A1 | Bug | Seed stores `amenities` as `"WiFi, TV"` but the service `JSON.parse`s it → seeded rooms return `[]`. Seed must store JSON arrays. |
| A2 | Bug | `src/types` `Room`/`Booking` don't match the Prisma schema (`name`, `imageUrl`, `features`, `totalPrice` don't exist). Align types with schema. |
| A3 | Bug | `GET /bookings/:id` and `GET /messages/:id` return any user's data → restrict to owner or admin (403 otherwise). |
| A4 | Bug | `POST /bookings` has no validation: check `checkOut > checkIn`, dates not in the past, room exists, **no overlap** with confirmed/pending bookings → `409 Room not available`. |
| A5 | Bug | Prisma client instantiated twice (`services/auth.ts` creates its own) → use `lib/prisma`. |
| A6 | Change | Register returns `400 Username already exists` for *any* error → `409` for duplicate username/email, `400` with field errors for validation. The `solutions` branch only asserts success codes, so it is unaffected; regenerate `swagger.json` / Zod schemas. |
| A7 | New | Public read endpoints (no auth): `GET /api/public/rooms`, `GET /api/public/rooms/:id`, `GET /api/public/branding`. Existing authenticated endpoints keep their behaviour. |
| A8 | New | Query params on public rooms: `?type=&minPrice=&maxPrice=&capacity=&checkIn=&checkOut=&sort=price\|-price\|number&page=&pageSize=` → `{ data, meta: { page, pageSize, total } }`. |
| A9 | New | `Room.imageUrl` (nullable) + `POST /api/rooms/:id/image` (multipart, admin). |
| A10 | New | `Booking.totalPrice` computed server-side (nights × price). |
| A11 | New | `GET /api/bookings/:id/invoice?format=pdf\|csv` (owner/admin) → `Content-Disposition: attachment`. |
| A12 | New | Booking status change emits SSE event `booking.updated` via `GET /api/events?token=` (EventSource can't send headers). |
| A13 | New | `POST /api/public/messages` (contact form for guests; name + email + subject + content). |
| A14 | New | `PUT /api/rooms/order` (admin) – persists drag-and-drop order (`Room.position`). |
| A15 | New | Test support endpoints – see §5. |
| A16 | Hygiene | Remove `console.log` of request bodies (register logs passwords) or guard behind `DEBUG`. Read `JWT_SECRET` from `.env` with a dev default. |

---

## 5. Test support

On by default, off when `NODE_ENV=production`. `BOOKER_TEST_API=1` / `0` overrides both. Documented in Swagger under "Testing" (only when enabled).

| Endpoint | Purpose |
|---|---|
| `POST /api/testing/reset` | Truncate all tables, run seed. |
| `POST /api/testing/seed` | Body `{ namespace, users?, rooms?, bookings? }` → creates namespaced data (e.g. usernames `w3-alice`), returns created entities + tokens. Used by per-worker fixtures. |
| `DELETE /api/testing/namespace/:ns` | Clean up a worker's data. |
| `GET`/`PUT /api/testing/flags` | Read or toggle feature flags at runtime (see §7). Also settable per request via header `x-booker-flags: slow-rooms,bug-a11y`. Reset turns all flags off. |

Seed data (fixed, deterministic, idempotent via `upsert`): `admin`/`password123` (ADMIN), `user`/`password123` (USER), 12 rooms (3 types, varied price/capacity, 1 `MAINTENANCE`; 2 with images once A9 lands), bookings in past/future with every status (dates relative to today), 5 messages (unread/read/archived).

---

## 6. Pages & features

Topic codes: **LOC** locators · **ACT** actions · **AST** web-first assertions · **NET** network wait/mock · **AUTH** storageState · **POM** page objects/fixtures · **VIS** visual · **A11Y** accessibility · **DLG** dialogs · **FILE** upload/download · **DND** drag & drop · **FRAME** iframe · **TAB** popups/new pages · **SHD** shadow DOM · **CTX** multiple contexts · **CLK** clock · **EMU** emulation (mobile/locale/geo/colour scheme) · **HYB** API + UI.

### Public / guest

| Route | Features | Topics |
|---|---|---|
| `/` Home | Hotel branding (name, logo, theme colours from API), hero, "deal of the day" banner (random unless test mode), featured rooms, **embedded map iframe** (OpenStreetMap), contact form. | VIS (mask banner), FRAME, AST |
| `/rooms` | Room cards with filters (type checkboxes, price **range slider**, capacity select, **date range picker** for availability), sort select, pagination, empty state. Filters reflected in URL query. | LOC, ACT, AST (`toHaveCount`), NET (`waitForResponse`) |
| `/rooms/:number` | Room detail, image gallery (lightbox **modal**), amenities list, price calculator (nights × price), "Book now". Unavailable dates disabled in picker. | ACT, AST, DLG (modal) |
| `/login`, `/register` | Labelled forms, client-side validation (required, email, password ≥ 8, confirm password), server errors in `role="alert"`, show/hide password toggle, "remember me" checkbox. Register success → toast + redirect to login. | LOC (`getByLabel`), AST, NET (mock 409) |
| `/terms` | Opened via link with `target="_blank"` from register & booking forms. | TAB |
| `/contact` | Contact form → `POST /api/public/messages`; success in `role="status"`. | ACT, NET |

### Authenticated user

| Route | Features | Topics |
|---|---|---|
| `/book/:number` | Multi-step booking wizard: 1) dates + guests (adults/children steppers) 2) extras (checkboxes: breakfast, parking, late check-out) 3) review + **payment widget (web component, shadow DOM)** + accept terms + confirm. Back/next preserves state. Overlap → `409` → inline error. | ACT, AST, NET, POM, SHD |
| `/my/bookings` | Table: room, dates, nights, total, **status badge** (live via SSE). Actions: cancel (native **`confirm()`** dialog), download invoice (**PDF/CSV**). Tabs: Upcoming / Past / Cancelled. | DLG, FILE (download), CTX, AST |
| `/my/messages` | Own messages with status. | LOC |
| `/my/profile` | Edit e-mail, **avatar upload** (preview), colour scheme (light/dark/system), language (EN/NL). | FILE (upload), EMU |
| Header | Notification bell with unread count (SSE), user **hover menu**, logout. Countdown "Check-in opens in hh:mm:ss" for bookings starting today (check-in from 15:00). | ACT (hover), CLK |

### Admin

| Route | Features | Topics |
|---|---|---|
| `/admin/rooms` | Data table: sortable columns, text filter, pagination, row selection + bulk "set maintenance", create/edit room **modal**, image upload, delete with custom confirm **modal**. **Drag-and-drop** row reordering (persists order). | LOC (rows/cells), DND, FILE, DLG |
| `/admin/bookings` | All bookings, filter by status/date, approve/reject (→ SSE to guest). | CTX, NET |
| `/admin/messages` | Inbox, mark read/archived, unread badge in sidebar. | AST |
| `/admin/reports` | Generate report (type + period), **chart** (SVG – screenshot target), export CSV. | VIS, FILE |
| `/admin/branding` | Edit name, colours (**colour picker**), description, map coordinates; live preview **iframe** of home page; reset to defaults. | FRAME, VIS |

Responsive: < 720 px → hamburger menu, cards instead of tables (EMU / mobile project).
i18n: EN + NL via `navigator.language`, overridable in profile (`locale` emulation).

---

## 7. Feature flags: bug mode & chaos mode

Off by default; toggled via `/api/testing/flags`, header `x-booker-flags`, or a trainer panel at `/__trainer`.

| Flag | Effect | Exercise |
|---|---|---|
| `slow-rooms` | `/api/public/rooms` delays 1–3 s | Why web-first assertions beat `waitForTimeout` |
| `flaky-booking` | 30 % of `POST /bookings` return 500 | Retries, traces, mocking for stability |
| `stale-list` | Bookings list doesn't refresh after cancel until reload | Find the bug with a good assertion |
| `bug-a11y` | Removes labels/alt text, low-contrast badge | axe scan finds violations |
| `bug-visual` | Shifts layout by 3 px, changes button colour | Visual regression catches it |
| `bug-price` | Total price off by one night | Hybrid test: compare API vs UI |
| `bug-auth` | Expired token not handled → blank page | Negative testing / storageState expiry |
| `random-order` | Rooms returned in random order | Avoid `nth()` locators |
| `popup-cookie` | Cookie consent overlay on first visit | `addLocatorHandler` |

---

## 8. Assignment mapping

Numbered in the order of the UI deck (`ui.md` in [playwright-training-slides](https://github.com/Ghislain89/playwright-training-slides)).

| # | Assignment | Topics |
|---|---|---|
| 1A | Record (codegen) or write a test: register a new user, log in, see "No bookings yet". | Codegen, LOC |
| 1B | HTML reporter + traces, duplicate the test, run in parallel → discover data collisions; fix with generated data. | Config, parallelism |
| 2 | Refactor to page objects + fixtures; bonus: complete the booking wizard and verify in My bookings. | POM |
| 3 | Setup project storing `user` and `admin` storageState; use per project. Bonus: log in via the API and set `booker.token`. | AUTH |
| 4 | Network: mock `POST /api/bookings` → `409` and assert the "Room not available" alert; bonus: patch the rooms response to add a fake room. Hybrid: seed room + booking via API, verify in UI, or act in UI and verify via API; bonus: per-worker data fixture. | NET, HYB |
| 5 | Pick one: cancel a booking (native confirm dialog) and download its invoice · two contexts (guest books, admin approves, guest sees the status change live) · `page.clock` check-in at 15:00 · mobile project + NL locale + dark mode · admin room image upload + drag & drop reorder · terms in a new tab + payment widget in shadow DOM. | DLG, FILE, CTX, CLK, EMU, DND, TAB, SHD |
| 6 | Screenshot home page, mask "deal of the day"; then hide it via `stylePath`; bonus: WebP. | VIS |
| 7 | axe scan on the booking wizard, attach the results; bonus: aria snapshots. Trainer variant: enable `bug-a11y` and compare. | A11Y |
| 8 | GitHub Actions workflow (HTML report artifact; bonus: sharded + merged reports). | CI |
| 9 *(optional)* | Test agents: plan and generate "cancel a booking", then review the result. | AI |
| 10 | Flaky-test clinic: enable `slow-rooms`, `flaky-booking`, `random-order`, `popup-cookie`; make the suite stable. | Debugging |

---

## 9. Delivery phases

**Phase 0 – API fixes (½ day)**
A1–A6, A16; test-support endpoints (§5). Existing API assignment still passes.
✅ Done. Also fixed: `PUT /bookings/:id`, `PUT /messages/:id` and all branding routes always returned 500; booking/message responses leaked the user's password hash; report `data`/`period` were JSON strings; deleting a room with bookings returned a misleading 404 (now 409). All input is validated (400 + `details`), API docs moved to `src/docs/*.yaml`, and CI checks types and `swagger.json` drift. API-side effects of the `slow-rooms`, `random-order` and `flaky-booking` flags are in; the UI flags follow in phase 3.

**Phase 1 – MVP replacing the todo app (2–3 days)**
Scaffold `web/`, single-port serving, auth pages, `/rooms` (filters + pagination), room detail, booking wizard (without shadow DOM), My bookings (cancel + confirm), admin rooms (CRUD, no DnD), deterministic mode.
✅ Done when assignments 1A–4 and 6–9 can be completed and reference solutions pass with `fullyParallel: true` on Chromium, Firefox and WebKit.
✅ Done. Rooms and bookings in the UI use the room number (`/rooms/101`, `/book/101`). The API gained public endpoints (`/api/public/rooms` with search and availability, `/api/public/rooms/{idOrNumber}`, `/api/public/branding`), booking guests and extras with a server-side `totalPrice`, and a `featured` flag on rooms. Not in this phase: contact form, gallery, messages, profile, admin messages/reports/branding pages and the header notifications; they follow in phase 2. Reference solutions are on the `solutions` branch; CI runs them on all three browsers.

**Phase 2 – Advanced topics (2–3 days)**
SSE + notifications, invoice download, uploads, drag & drop, iframe map + branding preview, terms tab, shadow DOM payment widget, clock countdown, i18n, dark mode, responsive layout. Also the pages that phase 1 skipped: contact form, room gallery, my messages, profile, admin messages, reports and branding.
✅ Done when all options of assignment 5 have reference solutions.

**Phase 3 – Trainer tooling (1–2 days)**
Feature flags + `/__trainer` panel, optional Docker image, preparation page update.
✅ Done when assignment 10 works and the full suite passes on a fresh clone (macOS, Windows, Linux).

---

## 10. Open decisions

1. ~~**Register duplicate status:**~~ Decided: `409` (implemented in phase 0).
2. **Public endpoints:** new `/api/public/*` (recommended, non-breaking) vs make existing `GET /rooms` anonymous.
3. **Token storage:** `localStorage` (simple, visible in storageState) vs httpOnly cookie (realistic). Recommendation: localStorage, cover cookies in the slides.
4. **Licence:** e.g. MIT for code, CC BY-NC-SA for training material (as Tim does).
