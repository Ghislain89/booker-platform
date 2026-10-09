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
| Home (featured rooms, deal of the day) | `/` | everyone |
| Rooms (filters, sorting, pagination) | `/rooms` | everyone |
| Room details | `/rooms/:number`, for example `/rooms/101` | everyone |
| Log in / Register | `/login`, `/register` | everyone |
| Terms and conditions | `/terms` | everyone |
| Booking wizard (dates & guests, extras, review) | `/book/:number` | logged in |
| My bookings (upcoming, past, cancelled) | `/my/bookings` | logged in |
| Room management | `/admin/rooms` | admin |
| Booking management (approve or reject) | `/admin/bookings` | admin |

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

Trainer flags switch on deliberate bugs or flakiness, for example `slow-rooms`, `random-order` and `flaky-booking`. Set them for everyone with `PUT /api/testing/flags`, or for a single request with the `x-booker-flags: slow-rooms,random-order` header. See [docs/frontend-spec.md](docs/frontend-spec.md) §7 for the full list. The full request and response formats are in Swagger.

### Environment variables

| Variable | Default | Effect |
| --- | --- | --- |
| `PORT` | `3000` | Server port |
| `DEBUG` | off | `DEBUG=booker` logs every request and database query |
| `BOOKER_TEST_API` | on (off in production) | `BOOKER_TEST_API=0` disables the test support API |
| `JWT_SECRET` | `booker-dev-secret` | Secret used to sign tokens |

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

Assignments 5 and 10 use features that are still on the [roadmap](docs/frontend-spec.md).

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
The training slides live in [playwright-training-slides](https://github.com/Ghislain89/playwright-training-slides) and are licensed under CC BY-NC-SA 4.0.
