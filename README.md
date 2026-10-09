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

## Folder structure

```
├── src/                     # API server (Express)
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
- Validate that the token you received is valid.

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

## Solutions

All assignments are worked out on the [`solutions`](https://github.com/Ghislain89/booker-platform/tree/solutions) branch. There are many ways to solve each assignment. The solutions show what _could_ be a good approach. Depending on your organisation's context, you might do things (very) differently, and that's fine.
