// Assignment 5, option "Emulation". Runs in the `mobile` project:
// a Pixel 7 with `locale: 'nl-NL'` and `colorScheme: 'dark'`.
import { test, expect } from "../../support/fixtures/ui.fixture";

test("menu button on a phone", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  const menu = page.getByRole("button", { name: "Menu", exact: true });

  await expect(nav).toBeHidden();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await nav.getByRole("link", { name: "Mijn boekingen" }).click();

  await expect(page).toHaveURL(/\/my\/bookings$/);
  // The menu closes after navigating.
  await expect(nav).toBeHidden();
});

test("Dutch texts follow the browser locale", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  await expect(
    page.getByRole("heading", { name: "Uitgelichte kamers" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Bekijk alle kamers" })).toBeVisible();
});

test("dark mode follows the device", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveCSS("background-color", "rgb(18, 24, 32)");

  // Choosing "Licht" on the profile page wins over the device setting.
  await page.goto("/my/profile");
  await page.getByRole("radio", { name: "Licht" }).check();
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect(html).not.toHaveCSS("background-color", "rgb(18, 24, 32)");
});

test("tables become cards on a small screen", async ({ page, seed }) => {
  const { rooms } = await seed({
    rooms: [{ number: "801", type: "STANDARD", price: 90, capacity: 2 }],
    bookings: [
      { user: "user", room: "801", checkIn: "2032-05-01", checkOut: "2032-05-02" },
    ],
  });
  await page.goto("/my/bookings");
  const row = page
    .getByTestId("booking-row")
    .filter({ hasText: `Room ${rooms[0].number} (` });
  await expect(row).toHaveCSS("display", "block");
  // As a card, every cell repeats its column header.
  await expect(row.getByRole("cell").first()).toHaveAttribute("data-label", "Room");
});
