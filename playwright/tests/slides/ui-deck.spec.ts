// The code examples from the UI slides (decks/playwright-training/ui.md in
// github.com/Ghislain89/ghislain.dev), run against this app so they can't go stale.
// One test per slide, named after the slide. Change a slide? Change its test too.
//
//   npx playwright test --project slides
//
// Not part of the assignments, and not how you'd structure a suite: the tests stay
// close to the slides on purpose.
import fs from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import {
  test as base,
  expect,
  type APIRequestContext,
  type Locator,
  type Page,
} from "@playwright/test";

const PASSWORD = "password123";

type Seeded = {
  namespace: string;
  users: { token: string; password: string; user: { username: string } }[];
  rooms: { id: string; number: string }[];
  bookings: { id: string }[];
};

type User = { username: string; password: string };

// "Page objects", as on the slide
class LoginPage {
  readonly username: Locator;
  readonly password: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByLabel("Username");
    this.password = page.getByLabel("Password");
  }

  async login(user: User) {
    await this.page.goto("/login");
    await this.username.fill(user.username);
    await this.password.fill(user.password);
    await this.page.getByRole("button", { name: "Log in" }).click();
  }
}

type Fixtures = {
  seed: (input: object) => Promise<Seeded>;
  loginPage: LoginPage;
  guest: User;
};

const test = base.extend<Fixtures>({
  // "Defining fixtures", as on the slide
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  guest: async ({ request }, use) => {
    const namespace = `t_${crypto.randomUUID().slice(0, 8)}`;
    const response = await request.post("/api/testing/seed", {
      data: { namespace, users: [{ username: "guest" }] },
    });
    const { user, password } = (await response.json()).data.users[0];
    await use({ username: user.username, password });
    await request.delete(`/api/testing/namespace/${namespace}`);
  },
  // Test data through the test-support API, removed after the test.
  seed: async ({ request }, use) => {
    const namespace = `slides_${crypto.randomUUID().slice(0, 8)}`;
    await use(async (input) => {
      const response = await request.post("/api/testing/seed", {
        data: { namespace, ...input },
      });
      await expect(response).toBeOK();
      return (await response.json()).data;
    });
    await request.delete(`/api/testing/namespace/${namespace}`);
  },
});

async function apiToken(request: APIRequestContext, username: string, password = PASSWORD) {
  const response = await request.post("/api/auth/login", { data: { username, password } });
  await expect(response).toBeOK();
  return (await response.json()).data.token as string;
}

/** Starts the page logged in, as a storage state file would. */
async function logIn(page: Page, request: APIRequestContext, username = "user") {
  const token = await apiToken(request, username);
  await page.addInitScript((value) => window.localStorage.setItem("booker.token", value), token);
}

/** Saves a storage state file for an account, as auth.setup.ts would. */
async function saveState(page: Page, request: APIRequestContext, username: string, path: string) {
  const token = await apiToken(request, username);
  await page.goto("/");
  await page.localStorage.setItem("booker.token", token);
  await page.context().storageState({ path });
}

/** The booking wizard up to the "Confirm booking" button, as a BookingWizard page object would. */
async function fillWizard(page: Page, number: string, checkIn = "2031-05-01", checkOut = "2031-05-03") {
  await page.goto(`/book/${number}`);
  await page.getByLabel("Check-in date").fill(checkIn);
  await page.getByLabel("Check-out date").fill(checkOut);
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("I accept the terms and conditions").check();
  await page.getByLabel("Cardholder name").fill("Slide Tester");
  await page.getByLabel("Card number").fill("4242 4242 4242 4242");
  await page.getByLabel("Expiry date (MM/YY)").fill("12/34");
  await page.getByLabel("CVC").fill("123");
}

/** yyyy-mm-dd in local time, the "today" the browser uses. */
const localDate = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

test.describe("Evening 1", () => {
  test.describe("Anatomy of a test", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/login");
    });

    test("user can log in", { tag: "@smoke" }, async ({ page }) => {
      await test.step("fill in the credentials", async () => {
        await page.getByLabel("Username").fill("user");
        await page.getByLabel("Password").fill("password123");
      });
      await page.getByRole("button", { name: "Log in" }).click();
      await expect(page.getByRole("heading", { name: "My bookings" })).toBeVisible();
    });
  });

  test("Locators: find elements like a user would", async ({ page, browser, request, seed }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Log in" })).toHaveCount(1);

    await page.goto("/rooms");
    await expect(page.getByLabel("Check-in date")).toHaveCount(1);

    await page.goto("/rooms/101");
    await expect(page.getByAltText("Photo 1 of 3 of room 101")).toHaveCount(1);

    await page.goto("/");
    await expect(page.getByTitle("Map showing the hotel location")).toHaveCount(1);

    const admin = await browser.newPage();
    await logIn(admin, request, "admin");
    await admin.goto("/admin/rooms");
    await expect(admin.getByPlaceholder("Search rooms")).toHaveCount(1);
    await admin.close();

    const { users } = await seed({ users: [{ username: "new" }] });
    const newUser = await browser.newPage();
    await logIn(newUser, request, users[0].user.username);
    await newUser.goto("/my/bookings");
    await expect(newUser.getByText("No bookings yet")).toHaveCount(1);
    await fillWizard(newUser, "203");
    await expect(newUser.getByTestId("total-price")).toHaveCount(1);
    await newUser.close();
  });

  test("Strict mode: one locator, one element", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByLabel("Password").fill("secret123")).rejects.toThrow(
      /strict mode violation: getByLabel\('Password'\) resolved to 2 elements/,
    );
    await page.getByLabel("Password", { exact: true }).fill("secret123");
    await expect(page.getByRole("link", { name: "Terms" })).toHaveCount(2);
    await expect(page.getByRole("main").getByRole("link", { name: "Terms" })).toHaveCount(1);

    await page.goto("/rooms");
    await expect(
      page.getByRole("article", { name: "Room 201" }).getByRole("link", { name: "Book now" }),
    ).toHaveCount(1);
  });

  test("Assignment 1A keeps two strict mode violations on purpose", async ({ page }) => {
    // Don't "fix" these in the app: assignment 1A is where participants meet strict mode.
    await page.goto("/login");
    await expect(page.getByRole("link", { name: "Register" })).toHaveCount(2);
    await page.goto("/register");
    await expect(page.getByLabel("Password")).toHaveCount(2);
  });

  test("Narrowing down", async ({ page, request, seed }) => {
    const { users } = await seed({
      users: [{ username: "guest" }],
      bookings: [
        { user: "guest", room: "101", checkIn: "2031-07-01", checkOut: "2031-07-03" },
        { user: "guest", room: "102", checkIn: "2031-08-01", checkOut: "2031-08-03" },
      ],
    });
    await logIn(page, request, users[0].user.username);
    await page.goto("/rooms");

    const deluxe = page.getByRole("article").filter({ hasText: "Deluxe" });
    await expect(deluxe).toHaveCount(2);
    await expect(page.getByRole("article")).toHaveCount(6);

    const card = page.getByRole("article", { name: "Room 201" });
    await card.getByRole("link", { name: "Book now" }).click();
    await expect(page).toHaveURL(/\/book\/201$/);

    await page.goto("/my/bookings");
    const cancellable = page
      .getByRole("row")
      .filter({ has: page.getByRole("button", { name: "Cancel booking" }) });
    await expect(cancellable).toHaveCount(2);
  });

  test("Actions", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill("user");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByLabel("Remember me").check();
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("heading", { name: "My bookings" })).toBeVisible();

    await page.goto("/rooms");
    await page.getByLabel("Suite").check();
    await page.getByLabel("Sort by").selectOption("Price: low to high");
    await page.getByLabel("Check-in date").fill("2031-05-01");
    await page.getByLabel("Check-in date").press("Tab");

    await page.getByRole("button", { name: "Account" }).hover();
    await expect(page.getByRole("link", { name: "My profile" })).toBeVisible();

    await page.goto("/my/profile");
    await page.getByLabel("Choose a photo").setInputFiles("playwright/test-data/avatar.png");
    await expect(page.getByLabel("Choose a photo")).toHaveValue(/avatar\.png$/);
  });

  test("Web-first assertions", async ({ page, request, seed }) => {
    const { users } = await seed({ users: [{ username: "new" }] });
    await logIn(page, request, users[0].user.username);
    await page.goto("/my/bookings");
    await expect(page.getByText("No bookings yet")).toBeVisible();
  });

  test("Assertions you'll use most", async ({ page, request }) => {
    await logIn(page, request);
    await page.goto("/my/bookings");
    await expect(page).toHaveURL(/\/my\/bookings/);
    await expect(page).toHaveTitle("My bookings | Booker");
    await expect(page.getByRole("tab", { name: "Upcoming" })).toHaveAttribute("aria-selected", "true");

    await page.goto("/book/203");
    await expect(page.getByLabel("Adults")).toHaveValue("1");
    await page.getByLabel("Check-in date").fill("2031-03-01");
    await page.getByLabel("Check-out date").fill("2031-03-03");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByLabel("Breakfast")).not.toBeChecked();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByTestId("total-price")).toHaveText("€ 350");
    await expect(page.getByRole("button", { name: "Confirm booking" })).toBeDisabled();
    await expect.soft(page.getByRole("heading", { level: 1 })).toHaveText("Book room 203");
  });

  test("Assertions you'll use most: the notification after registering", async ({ page }) => {
    const username = `slides_${crypto.randomUUID().slice(0, 8)}`;
    await page.goto("/register");
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Email").fill(`${username}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByLabel("Confirm password").fill(PASSWORD);
    await page.getByLabel("I accept the terms and conditions").check();
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByRole("region", { name: "Notifications" })).toContainText(
      "Account created",
      { timeout: 10_000 },
    );
  });
});

test.describe("Evening 2", () => {
  test("Page objects and Defining fixtures", async ({ loginPage, guest, page }) => {
    await loginPage.login(guest);
    await expect(page.getByText("No bookings yet")).toBeVisible();
  });

  test("Setup project: save the state", async ({ page }, testInfo) => {
    const userFile = testInfo.outputPath("user.json");
    await page.goto("/login");
    await page.getByLabel("Username").fill("user");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
    await page.context().storageState({ path: userFile });
    expect(fs.readFileSync(userFile, "utf8")).toContain("booker.token");
  });

  test("Log in via the API", async ({ page, request, browser }, testInfo) => {
    const userFile = testInfo.outputPath("user.json");
    const response = await request.post("/api/auth/login", {
      data: { username: "user", password: "password123" },
    });
    const { token } = (await response.json()).data;

    await page.goto("/");
    await page.localStorage.setItem("booker.token", token);
    await page.context().storageState({ path: userFile });

    const context = await browser.newContext({ storageState: userFile });
    const loggedIn = await context.newPage();
    await loggedIn.goto("/my/bookings");
    await expect(loggedIn.getByRole("heading", { name: "My bookings" })).toBeVisible();
    await context.close();
  });

  test("Waiting for requests & responses", async ({ page, request, seed }) => {
    const { rooms } = await seed({
      rooms: [{ number: "701", type: "DELUXE", price: 150, capacity: 2 }],
    });
    await logIn(page, request);
    await fillWizard(page, rooms[0].number);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/bookings") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Confirm booking" }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
  });

  test("Mocking responses", async ({ page, request }) => {
    await logIn(page, request);
    await page.route("**/api/bookings", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      await route.fulfill({
        status: 409,
        json: { success: false, error: "Room not available" },
      });
    });

    await fillWizard(page, "203", "2031-05-01", "2031-05-03");
    await page.getByRole("button", { name: "Confirm booking" }).click();
    await expect(page.getByRole("alert")).toHaveText("Room not available");
  });

  test("Modifying responses", async ({ page }) => {
    await page.route("**/api/public/rooms*", async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      json.data.unshift({ ...json.data[0], id: "fake-room", number: "999", price: 1 });
      await route.fulfill({ response, json });
    });

    await page.goto("/rooms");
    await expect(page.getByRole("article", { name: "Room 999" })).toContainText("€ 1");
  });

  test("Seed data via the API", async ({ page, request }) => {
    await logIn(page, request);
    const login = await request.post("/api/auth/login", {
      data: { username: "user", password: "password123" },
    });
    const headers = { Authorization: `Bearer ${(await login.json()).data.token}` };
    const room = (await (await request.get("/api/public/rooms/203")).json()).data;

    const response = await request.post("/api/bookings", {
      headers,
      data: { roomId: room.id, checkIn: "2030-06-01", checkOut: "2030-06-03" },
    });
    await expect(response).toBeOK();
    const booking = (await response.json()).data;

    await page.goto("/my/bookings");
    await expect(page.getByRole("row", { name: /June 1, 2030/ })).toBeVisible();

    await request.delete(`/api/bookings/${booking.id}`, { headers });
  });

  test.describe("Tools for unstable pages", () => {
    test.use({
      extraHTTPHeaders: { "x-booker-flags": "popup-cookie,flaky-booking,random-order" },
    });

    test("overlay handler, toPass and locators by name", async ({ page, request, seed }) => {
      const { rooms } = await seed({
        rooms: [{ number: "702", type: "SUITE", price: 300, capacity: 2 }],
      });
      await logIn(page, request);
      let handled = 0;
      await page.addLocatorHandler(
        page.getByRole("dialog", { name: "We value your privacy" }),
        async (dialog) => {
          handled++;
          await dialog.getByRole("button", { name: "Accept all" }).click();
        },
      );

      await page.goto("/rooms");
      await expect(page.getByRole("article", { name: "Room 201" })).toHaveCount(1);

      await fillWizard(page, rooms[0].number);
      await expect(async () => {
        await page.getByRole("button", { name: "Confirm booking" }).click();
        await expect(page).toHaveURL(/\/my\/bookings$/, { timeout: 5_000 });
      }).toPass({ timeout: 30_000 });

      // The pop-up shows up once, after a random delay: keep acting until the handler ran.
      await expect
        .poll(async () => {
          await page.getByRole("tab", { name: "Past" }).click();
          return handled;
        })
        .toBeGreaterThan(0);
    });
  });
});

test.describe("Going further", () => {
  test("Controlling time: page.clock", async ({ page, request }) => {
    await logIn(page, request);
    const today = localDate(new Date());

    await page.clock.setFixedTime(new Date(`${today}T14:59:50`));
    await page.goto("/my/bookings");
    const countdown = page.getByTestId("check-in-countdown").filter({ hasText: "room 302" });
    await expect(countdown).toHaveText("Check-in for room 302 opens in 00:00:10");

    await page.clock.setFixedTime(new Date(`${today}T15:00:00`));
    await expect(countdown).toHaveText("Check-in for room 302 is open");
  });

  test("Multiple users: multiple contexts", async ({ browser, page, request, seed }, testInfo) => {
    const { rooms } = await seed({
      rooms: [{ number: "703", type: "SUITE", price: 300, capacity: 2 }],
      bookings: [
        { user: "user", room: "703", checkIn: "2031-12-01", checkOut: "2031-12-03", status: "PENDING" },
      ],
    });
    const number = rooms[0].number;
    const userState = testInfo.outputPath("user.json");
    const adminState = testInfo.outputPath("admin.json");
    await saveState(page, request, "user", userState);
    await saveState(page, request, "admin", adminState);

    await using guest = await browser.newContext({ storageState: userState });
    await using admin = await browser.newContext({ storageState: adminState });
    const guestPage = await guest.newPage();
    const adminPage = await admin.newPage();

    await guestPage.goto("/my/bookings");
    await adminPage.goto("/admin/bookings");
    const pending = adminPage.getByRole("row", { name: `Room ${number}` });
    await pending.getByRole("button", { name: "Approve" }).click();

    const booking = guestPage.getByRole("row", { name: `Room ${number}` });
    await expect(booking.getByTestId("status-badge")).toHaveText("Confirmed");
  });

  test("Dialogs, downloads & new tabs", async ({ page, browser, request, seed }) => {
    // The slide cancels room 201; this test cancels a seeded booking, so the seed data stays intact.
    const { users, rooms } = await seed({
      users: [{ username: "guest" }],
      rooms: [{ number: "201", type: "DELUXE", price: 160, capacity: 2 }],
      bookings: [{ user: "guest", room: "201", checkIn: "2031-07-01", checkOut: "2031-07-03" }],
    });
    await logIn(page, request, users[0].user.username);
    await page.goto("/my/bookings");
    const row = page.getByRole("row", { name: new RegExp(`Room ${rooms[0].number}`) });
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Cancel booking" }).click();
    await expect(row).toHaveCount(0);

    const user = await browser.newPage();
    await logIn(user, request);
    await user.goto("/my/bookings");
    const downloadPromise = user.waitForEvent("download");
    await user.getByRole("button", { name: "Download CSV invoice for room 302" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^invoice-room-302-[\d-]+\.csv$/);
    await user.close();

    await page.goto("/register");
    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("main").getByRole("link", { name: "Terms" }).click();
    await expect(await popupPromise).toHaveTitle(/Terms and conditions/);
  });

  test("Frames & shadow DOM", async ({ page, request }) => {
    await page.goto("/");
    const map = page.getByTitle("Map showing the hotel location").contentFrame();
    await expect(map.getByRole("button", { name: "Zoom in" })).toBeVisible();
    await expect(page.frameLocator().getByRole("button", { name: "Zoom in" })).toBeVisible();

    await logIn(page, request);
    await fillWizard(page, "203");
    await page.getByLabel("Card number").fill("4242 4242 4242 4242");
    await expect(page.getByLabel("Card number")).toHaveValue("4242 4242 4242 4242");
  });

  test("Visual regression testing: the locators", async ({ page }) => {
    await page.goto("/rooms");
    await expect(page.getByRole("article", { name: "Room 201" })).toHaveCount(1);
    await page.goto("/");
    await expect(page.getByTestId("deal-of-the-day")).toHaveCount(1);
  });

  test("Accessibility testing with axe", async ({ page, request }) => {
    await logIn(page, request);
    await page.goto("/book/101");
    await expect(page.getByRole("heading", { name: "Book room 101" })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations).toEqual([]);
  });

  test("ARIA snapshots", async ({ page, request }) => {
    await logIn(page, request);
    await page.goto("/rooms");
    await expect(page.getByRole("navigation", { name: "Main" })).toMatchAriaSnapshot(`
      - navigation "Main":
        - list:
          - listitem:
            - link "Rooms"
          - listitem:
            - link "My bookings"
        - button "Log out"
    `);
  });

  test("More locator tricks", async ({ page, request, seed }) => {
    const { users } = await seed({
      users: [{ username: "guest" }],
      bookings: [
        { user: "guest", room: "101", checkIn: "2031-07-01", checkOut: "2031-07-03" },
        { user: "guest", room: "102", checkIn: "2031-08-01", checkOut: "2031-08-03" },
      ],
    });
    await logIn(page, request, users[0].user.username);
    await page.goto("/my/bookings");
    await expect(page.getByRole("link", { name: "My bookings" }).visible()).toHaveCount(1);
    const checkIns = page.getByRole("cell").nth(1).within(page.getByRole("row"));
    await expect(checkIns).toHaveText(["July 1, 2031", "August 1, 2031"]);

    await fillWizard(page, "203");
    await expect(
      page.getByRole("button", { name: "Confirm booking" }).describe("Confirm booking"),
    ).toBeEnabled();

    await page.goto("/rooms");
    await expect(
      page.getByRole("article").filter({ hasNot: page.getByRole("link", { name: "Book now" }) }),
    ).toHaveCount(1);
  });

  test("Custom assertions", async ({ page, request }) => {
    const customExpect = expect.extend({
      async toHaveBookingStatus(row: Locator, status: string) {
        let pass = true;
        try {
          await expect(row.getByTestId("status-badge")).toHaveText(status);
        } catch {
          pass = false;
        }
        return { pass, name: "toHaveBookingStatus", message: () => `expected status "${status}"` };
      },
    });

    await logIn(page, request);
    await page.goto("/my/bookings");
    await customExpect(page.getByRole("row", { name: /Room 302/ })).toHaveBookingStatus("Confirmed");
  });

  test(
    "More runner and storage features",
    { lock: "branding" },
    async ({ page, request, context }, testInfo) => {
      const adminFile = testInfo.outputPath("admin.json");
      await saveState(page, request, "admin", adminFile);
      await context.setStorageState(adminFile);
      await page.goto("/admin/rooms");
      await expect(page.getByRole("heading", { name: "Room management" })).toBeVisible();
      await context.storageState({ path: testInfo.outputPath("indexeddb.json"), indexedDB: true });
    },
  );
});
