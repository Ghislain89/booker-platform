import { test, expect } from "../../support/fixtures/ui.fixture";

test("Assignment 4: a 409 from the API shows 'Room not available'", async ({
  page,
  bookingWizard,
}) => {
  await page.route("**/api/bookings", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    await route.fulfill({
      status: 409,
      json: { success: false, error: "Room not available" },
    });
  });

  await bookingWizard.goto("101");
  await bookingWizard.book({ checkIn: "2031-05-01", checkOut: "2031-05-03" });

  await expect(bookingWizard.error).toHaveText("Room not available");
  await expect(page).toHaveURL(/\/book\/101$/);
});

test("Assignment 4 bonus: patch the rooms response to add a fake room", async ({
  page,
}) => {
  const fakeRoom = {
    id: "fake-room",
    number: "999",
    type: "SUITE",
    price: 1,
    capacity: 8,
    amenities: ["Hot tub", "Pony"],
    status: "AVAILABLE",
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await page.route(
    (url) => url.pathname === "/api/public/rooms",
    async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      json.data.unshift(fakeRoom);
      json.meta.total += 1;
      await route.fulfill({ response, json });
    },
  );

  await page.goto("/rooms");

  const card = page.getByRole("article", { name: "Room 999" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("€ 1");
  await expect(card).toContainText("Pony");
});
