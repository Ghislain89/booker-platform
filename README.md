# Booker Platform

A small hotel booking platform that runs entirely on your own machine. It's the test object for the Playwright trainings by [Ghislain Gabriëlse](https://github.com/Ghislain89) (DeTesters).

- **API**: Express + Prisma (SQLite) + JWT, with Swagger docs. Used in the API testing workshop.
- **UI**: coming soon, served from the same server. See [docs/frontend-spec.md](docs/frontend-spec.md).

> This repository replaces [PlaywrightWorkshop](https://github.com/Ghislain89/PlaywrightWorkshop) (the Next.js todo app) and [playwright-api-assignment](https://github.com/Ghislain89/playwright-api-assignment).

## Getting started

Before the workshop, install Git, Node.js (LTS), VS Code and the Playwright VS Code extension. See the [preparation page](https://ghislain.dev/playwright/preparation.html) for details.

```bash
git clone https://github.com/Ghislain89/booker-platform.git
cd booker-platform
npm install
npx playwright install   # downloads the browsers
npm run setup   # creates and seeds the local SQLite database
npm run dev     # starts the server on http://localhost:3000
```

Run the tests in a second terminal:

```bash
npx playwright test                          # all tests
npx playwright test assignment1.spec.ts      # a single file
npx playwright test --ui                     # UI mode
```

Playwright starts the server for you if it isn't running yet. You can also use the testing panel in VS Code.

`npm run setup` resets the database to its seeded state. Run it whenever you want a clean slate.

| What | URL |
| --- | --- |
| API | http://localhost:3000/api |
| API docs (Swagger) | http://localhost:3000/api-docs |

Seeded accounts:

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `password123` | admin |
| `user` | `password123` | user |

The seed also creates 12 rooms (101–104 standard, 201–204 deluxe, 301–304 suite; room 104 is under maintenance), bookings in every status and a few messages. Seeded dates are relative to today, so the data never goes stale.

### Business rules

- Bookings: `checkIn` can't be in the past and `checkOut` must be after `checkIn` (400). You can't book a room under maintenance or a room that already has a pending or confirmed booking for those dates (409). Checking out on the day the next guest checks in is fine.
- Only the owner of a booking (or an admin) can read or cancel it, and only the sender of a message (or an admin) can read it (403).
- Usernames and e-mail addresses are unique (409). Passwords need at least 8 characters.
- Invalid input returns 400 with a `details` object that names each invalid field.

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
│   │   └── api/             # API workshop assignments
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

## Documentation

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
