// Assignment 10: flaky-test clinic. Runs in the `chaos` project, which sends
// `x-booker-flags: slow-rooms,flaky-booking,random-order,popup-cookie` with every
// request:  npx playwright test --project chaos
import { test, expect } from "../../support/fixtures/ui.fixture";

test.beforeEach(async ({ page }) => {
  // popup-cookie: the banner appears after a random delay and blocks the page.
  // The handler clicks it away whenever it gets in the way of an action.
  await page.addLocatorHandler(
    page.getByRole("dialog", { name: "We value your privacy" }),
    async (banner) => {
      await banner.getByRole("button", { name: "Accept all" }).click();
    },
  );
});

test("home page shows the featured rooms in any order", async ({ page }) => {
  await page.goto("/");
  // random-order: find rooms by name, never with nth().
  // slow-rooms: web-first assertions wait for the slow response (1–3 s).
  for (const number of ["103", "201", "302"]) {
    await expect(
      page.getByRole("heading", { name: `Room ${number}`, exact: true }),
    ).toBeVisible();
  }
});

test("filter the rooms page down to one room", async ({ page, seed }) => {
  const { rooms } = await seed({
    rooms: [{ number: "990", type: "SUITE", price: 400, capacity: 6 }],
  });
  const room = rooms[0];

  await page.goto("/rooms");
  await page.getByLabel("Guests").selectOption("6");
  const results = page.getByRole("region", { name: "Results" });
  await expect(
    results.getByRole("heading", { name: `Room ${room.number}`, exact: true }),
  ).toBeVisible();
});

test("book a room, even when the server hiccups", async ({
  page,
  seed,
  bookingWizard,
  myBookings,
}) => {
  const { rooms } = await seed({
    rooms: [{ number: "991", type: "DELUXE", price: 150, capacity: 2 }],
  });
  const room = rooms[0];

  await bookingWizard.goto(room.number);
  await bookingWizard.fillDatesAndGuests({
    checkIn: "2032-08-01",
    checkOut: "2032-08-03",
  });
  await bookingWizard.chooseExtras();
  await bookingWizard.acceptTerms.check();
  await bookingWizard.pay();

  // flaky-booking: 30% of the bookings fail with a 500. A real guest clicks
  // "Confirm booking" again, so the test does too. Only this step is retried,
  // not the whole test.
  await expect(async () => {
    if (await bookingWizard.confirm.isVisible()) {
      await bookingWizard.confirm.click();
    }
    await expect(page).toHaveURL(/\/my\/bookings$/, { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });

  await expect(myBookings.rowFor(room.number)).toBeVisible();
});
