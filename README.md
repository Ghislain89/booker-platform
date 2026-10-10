# Booker Platform

A small hotel booking platform that runs entirely on your own machine. It's the test object for the Playwright trainings by [Ghislain Gabriëlse](https://github.com/Ghislain89) (DeTesters).

- **Web app**: React (Vite), served from the same server. Used in the UI testing workshop.
- **API**: Express + Prisma (SQLite) + JWT, with Swagger docs. Used in the API testing workshop.

The roadmap for the web app is in [docs/frontend-spec.md](docs/frontend-spec.md).

> This repository replaces [PlaywrightWorkshop](https://github.com/Ghislain89/PlaywrightWorkshop) (the Next.js todo app) and [playwright-api-assignment](https://github.com/Ghislain89/playwright-api-assignment).

## Getting started

Before the workshop, install Git, Node.js (LTS), VS Code and the Playwright VS Code extension. See the [preparation page](https://ghislain.dev/playwright/preparation.html) for details.

```bash
git clone https://github.com/Ghislain89/booker-platform.git
cd booker-platform
npm install
npx playwright install   # downloads the browsers
npm run setup   # creates and seeds the local SQLite database
npm run dev     # starts the web app and the API on http://localhost:3000
```

Run the tests in a second terminal:

```bash
npx playwright test                          # all tests (API + chromium)
npx playwright test --project API            # only the API tests
npx playwright test --project webkit         # firefox and webkit only run when you ask for them
npx playwright test assignment1.spec.ts      # a single file
npx playwright test --ui                     # UI mode
```

Playwright starts the server for you if it isn't running yet. You can also use the testing panel in VS Code.

`npm run setup` resets the database to its seeded state. Run it whenever you want a clean slate.

| What | URL |
| --- | --- |
| Web app | http://localhost:3000 |
| API | http://localhost:3000/api |
| API docs (Swagger) | http://localhost:3000/api-docs |

`npm run dev` serves the web app with Vite (hot reload). `npm run build && npm start` serves the production build instead.

### Docker (optional)

If you'd rather not install Node.js, run the whole platform in a container:

```bash
docker build -t booker .
docker run --rm -p 3000:3000 booker
```

The container serves the production build on http://localhost:3000 with the test support API switched on. It creates and seeds the database on the first start. Add `-v booker-data:/app/prisma/data` to keep data and uploads between runs. You still run Playwright on your own machine.

Seeded accounts:

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `password123` | admin |
| `user` | `password123` | user |

The seed also creates 12 rooms (101–104 standard, 201–204 deluxe, 301–304 suite; room 104 is under maintenance; 103, 201 and 302 are featured on the home page), bookings in every status and a few messages. Seeded dates are relative to today, so the data never goes stale.

### Business rules

- Bookings: `checkIn` can't be in the past and `checkOut` must be after `checkIn` (400). You can't book a room under maintenance or a room that already has a pending or confirmed booking for those dates (409). Checking out on the day the next guest checks in is fine.
- Only the owner of a booking (or an admin) can read or cancel it, and only the sender of a message (or an admin) can read it (403).
- A booking has `adults` (1–10, default 1), `children` (0–10) and `extras` (`BREAKFAST`, `PARKING`, `LATE_CHECKOUT`). More guests than the room's capacity is a 400. The API calculates `nights` and `totalPrice`: breakfast is €15 per guest per night, parking €12 per night and late check-out €25 per stay.
- Usernames and e-mail addresses are unique (409). Passwords need at least 8 characters.
- Invalid input returns 400 with a `details` object that names each invalid field.

## Web app

| Page | Route | Who |
| --- | --- | --- |
| Home (featured rooms, deal of the day, map, contact form) | `/` | everyone |
| Rooms (filters, sorting, pagination) | `/rooms` | everyone |
| Room details (photo gallery with lightbox) | `/rooms/:number`, for example `/rooms/101` | everyone |
| Log in / Register | `/login`, `/register` | everyone |
| Terms and conditions | `/terms` | everyone |
| Contact | `/contact` | everyone |
| Booking wizard (dates & guests, extras, review + payment) | `/book/:number` | logged in |
| My bookings (upcoming, past, cancelled; invoices; check-in countdown) | `/my/bookings` | logged in |
| My messages | `/my/messages` | logged in |
| My profile (e-mail, photo, language, colour scheme) | `/my/profile` | logged in |
| Room management (photos, drag & drop order) | `/admin/rooms` | admin |
| Booking management (approve or reject) | `/admin/bookings` | admin |
| Messages (mark as read, archive) | `/admin/messages` | admin |
| Reports (chart, CSV export) | `/admin/reports` | admin |
| Branding (live preview in an iframe) | `/admin/branding` | admin |
| Trainer panel (flags, reset) | `/__trainer` | admin |

Things worth testing, by Playwright feature:

| Feature | Where |
| --- | --- |
| Native dialogs (`page.on('dialog')`) | Cancelling a booking in *My bookings* |
| Downloads | PDF and CSV invoices in *My bookings*, CSV export in *Reports* |
| File uploads | Profile photo, room photo (edit a room in *Room management*) |
| Drag & drop | *Room management* → *Change order* (or use the keyboard on the handles) |
| Multiple tabs | The terms link in the last step of the booking wizard |
| Shadow DOM | The payment form in the last step of the booking wizard (`<booker-payment>`) |
| Iframes | The map on the home page, the preview in *Branding* |
| Multiple contexts and live updates | Bookings and messages are pushed with server-sent events to the notification bell and the admin's unread counter |
| Clock (`page.clock`) | The check-in countdown in *My bookings* for bookings that start today (check-in opens at 15:00) |
| Emulation | Responsive layout below 720 px, `locale` (English/Dutch), `colorScheme` (light/dark) |

The payment form accepts any valid card number (Luhn check), for example `4242 4242 4242 4242`, with an expiry date in the future. Card `4000 0000 0000 0002` is always declined.

Notifications ("Booking cancelled." and so on) appear in a region named "Notifications": `page.getByRole('region', { name: 'Notifications' })`.

The web app stores the JWT in `localStorage` under `booker.token`, so you can log in through `POST /api/auth/login` and put the token there.

Add `?test=1` to any URL to switch on test mode for that browser. It's remembered in a cookie until you open a URL with `?test=0`. Test mode turns off animations and the blinking cursor, shows the same "deal of the day" every time and keeps notifications open until you dismiss them.

The web app uses public endpoints that don't need a token: `GET /api/public/rooms` (filters, sorting, pagination and availability for a date range), `GET /api/public/rooms/{idOrNumber}` and `GET /api/public/branding`.

## Test support API

For local development and training only. It's switched off when `NODE_ENV=production`.

| Endpoint | What it does |
| --- | --- |
| `POST /api/testing/reset` | Resets the database to the seed data and turns all flags off |
| `POST /api/testing/seed` | Creates users, rooms and bookings in a namespace, for example one per Playwright worker. Users come back with a token |
| `DELETE /api/testing/namespace/{ns}` | Deletes everything in a namespace |
| `GET` / `PUT /api/testing/flags` | Reads or sets the trainer flags |

Trainer flags switch on deliberate bugs or flakiness:

| Flag | Effect |
| --- | --- |
| `slow-rooms` | The rooms list takes 1–3 seconds |
| `flaky-booking` | 30% of new bookings fail with a 500 |
| `random-order` | Rooms come back in a random order |
| `popup-cookie` | A cookie banner appears after a random delay |
| `stale-list` | *My bookings* doesn't refresh after cancelling |
| `bug-a11y` | Missing labels and alt text, low-contrast badges |
| `bug-visual` | The page shifts 3 px and buttons change colour |
| `bug-price` | The booking wizard charges one night too many |
| `bug-auth` | An expired token gives a blank page instead of the login page |

Set them for everyone on the trainer panel (`/__trainer`, log in as `admin`) or with `PUT /api/testing/flags`. Set them for a single test with the `x-booker-flags: slow-rooms,random-order` header, for example through `extraHTTPHeaders` in a Playwright project. The web app reads the flags once, when the page loads. `POST /api/testing/reset` turns all flags off. The full request and response formats are in Swagger.

### Environment variables

| Variable | Default | Effect |
| --- | --- | --- |
| `PORT` | `3000` | Server port |
| `DEBUG` | off | `DEBUG=booker` logs every request and database query |
| `BOOKER_TEST_API` | on (off in production) | `BOOKER_TEST_API=0` disables the test support API |
| `JWT_SECRET` | `booker-dev-secret` | Secret used to sign tokens |
| `UPLOAD_DIR` | `uploads/` | Where uploaded photos are stored |

## Folder structure

```
├── web/                     # Web app (React + Vite)
├── src/                     # API server (Express); OpenAPI docs in src/docs/
├── prisma/                  # Database schema, migrations and seed data
├── docs/                    # Specs and design notes
├── playwright/
│   ├── support/
│   │   ├── datafactories/   # Functions that create test data
│   │   ├── fixtures/        # Fixtures for setting up and tearing down tests
│   │   ├── helpers/         # Helper functions used across tests
│   │   └── zod/             # Zod schemas for validating API responses
│   ├── tests/
│   │   ├── api/             # API workshop assignments
│   │   └── ui/              # UI workshop tests
│   └── types/               # Shared TypeScript types
└── playwright.config.ts
```

Balancing principles such as KISS and DRY is commonly considered good practice, and a clear folder structure is one of the easiest ways to do that.

## API assignments

Make sure to add assertions on status codes, the response body and headers.

### Assignment 1 (Authentication)

- Register a new (random) user.
- Log in as that user.
- Log out with the token you received.

### Assignment 2 (Rooms & Bookings)

- Find a room and conclude there's no room to your liking.
- Just add a new room. Construction will for sure be complete by the time you decide to go :-)
- Book your room.
- Ultimately, your kids bring back the flu from daycare. Cancel your booking.

### Bonus assignment

- How could we improve our setup?
- Could we do something smart to make our tests more readable?
- Could we reuse the same authenticated state for all tests?
- Could we make sure every response is structured correctly without explicitly validating this in every test?

## UI assignments

Put your UI tests in `playwright/tests/ui/`. `example.spec.ts` shows how a test looks. Prefer `getByRole` and `getByLabel`, and use web-first assertions.

### Assignment 1A (Your first test)

- Register a new user.
- Log in with that user.
- Assert that "No bookings yet" is shown.

### Assignment 1B (Parallel runs)

- Configure the HTML reporter and set `trace: 'on'`.
- Duplicate your test a few times, enable `fullyParallel` and run with `--repeat-each 5`. What breaks, and why?
- Fix it with unique test data per test.
- Open the report and a trace: which step is the slowest?

### Assignment 2 (Page objects and fixtures)

- Create `LoginPage` and `RegisterPage` page objects and refactor your test to use them.
- Expose the page objects as fixtures with `test.extend`.
- Bonus: add a `BookingWizard` page object, book a room and verify it in *My bookings*.

### Assignment 3 (Authentication)

- Write `auth.setup.ts` that saves the state for `user` and `admin`.
- Add `ui-user` and `ui-admin` projects that depend on `setup` and make your tests start logged in.
- Bonus: log in with `POST /api/auth/login` and set `booker.token` instead of using the login form.

### Assignment 4 (Network and hybrid tests)

- Mock `POST /api/bookings` to return `409` and assert the "Room not available" alert.
- Seed a room (as admin) and a booking (as user) via the API, then verify them in the UI. Or book in the UI and verify via `GET /api/bookings/my-bookings`.
- Bonus: patch the rooms response so a fake room shows up, and move the seeding into a fixture.

### Assignment 5 (Pick one)

Choose one of these, or more if you have time:

- **Dialogs and downloads:** cancel a booking (accept the native confirm dialog) and download its PDF invoice. Check the file name.
- **Multiple contexts:** a guest books a room in one context, the admin approves it in another, and the guest's notification bell shows the change without a reload.
- **Clock:** set the clock to 14:59:50 on the check-in day of a booking, check the countdown, fast-forward and see "Check-in for room N is open".
- **Emulation:** add a mobile project. Use the menu button on a phone, and check the Dutch texts (`locale: 'nl-NL'`) and dark mode (`colorScheme: 'dark'`).
- **Uploads and drag & drop:** upload a room photo as admin, then drag a room to a new position in *Change order*.
- **Tabs and shadow DOM:** open the terms from the booking wizard in a new tab, then fill the payment form (it's inside a shadow root) and finish the booking.

### Assignment 6 (Visual testing)

- Take a screenshot of the home page and run the test twice. Does it pass?
- Mask the "deal of the day" banner, then hide it with `stylePath` instead. Which do you prefer?
- Screenshots differ per operating system. To get Linux baselines for CI, run the "Update snapshots" workflow in the Actions tab of your fork.

### Assignment 7 (Accessibility)

- Run an axe scan (`@axe-core/playwright` is installed) on each step of the booking wizard and attach the results to the report.
- Bonus: add an aria snapshot of the main navigation and the booking summary.

### Assignment 8 (CI)

- Fork this repository and add a GitHub Actions workflow that runs your UI tests and uploads the HTML report.
- Bonus: shard over two jobs and merge the reports.

### Assignment 9 (optional, AI agents)

- Run `npx playwright init-agents`, let the planner write a plan for "cancel a booking" and generate the test. Would you merge it?

### Assignment 10 (Flaky-test clinic)

- Add a `chaos` project that sends `x-booker-flags: slow-rooms,flaky-booking,random-order,popup-cookie` with `extraHTTPHeaders`, and run your suite with it.
- What fails, and why? Use traces to find out.
- Make the suite stable without `waitForTimeout`: web-first assertions, `page.addLocatorHandler` for the cookie banner, locators that don't depend on the order, and retries only where a real user would retry.

## Documentation

- Playwright locators: https://playwright.dev/docs/locators
- Playwright API testing: https://playwright.dev/docs/api/class-apirequestcontext
- API assertions: https://playwright.dev/docs/api/class-apiresponseassertions
- Generic assertions: https://playwright.dev/docs/api/class-genericassertions
- HTTP status codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

## Changing the API

The API docs live in `src/docs/api.yaml` and `src/docs/testing.yaml`. After changing them:

```bash
npm run swagger:export      # writes playwright/support/zod/swagger.json
npm run codegen             # regenerates the zod schemas in playwright/support/zod/zod/
npm run schema:generation   # regenerates playwright/support/zod/api-schema.zod.ts
npm run typecheck
```

CI fails when `swagger.json` is out of date.

## Solutions

All assignments are worked out on the [`solutions`](https://github.com/Ghislain89/booker-platform/tree/solutions) branch. There are many ways to solve each assignment. The solutions show what _could_ be a good approach. Depending on your organisation's context, you might do things (very) differently, and that's fine.

## Licence

The code is licensed under the [MIT licence](LICENSE): fork it, copy it and use it in your own projects.
The training slides live in [presentations](https://github.com/Ghislain89/presentations/tree/main/decks/playwright-training) and are licensed under CC BY-NC-SA 4.0.
