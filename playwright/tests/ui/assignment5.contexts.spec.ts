// Assignment 5, option "Multiple contexts": the guest sees the admin's decision live.
import { faker } from "@faker-js/faker";
import { ADMIN_STATE } from "../../support/auth";
import type { Page } from "@playwright/test";
import { test, expect } from "../../support/fixtures/ui.fixture";

/** The admin's unread counter in the header. The badge is hidden at 0. */
async function unreadMessages(page: Page) {
  const badge = page.getByTestId("unread-count");
  if ((await badge.count()) === 0) return 0;
  return Number((await badge.textContent())?.match(/\d+/)?.[0]);
}

test("guest sees the approval without reloading", async ({
  page,
  browser,
  seed,
  myBookings,
}) => {
  const { rooms } = await seed({
    rooms: [{ number: "501", type: "SUITE", price: 300, capacity: 2 }],
    bookings: [
      {
        user: "user",
        room: "501",
        checkIn: "2031-12-01",
        checkOut: "2031-12-03",
        status: "PENDING",
      },
    ],
  });
  const room = rooms[0];

  // The guest (this test's own context)
  await myBookings.goto();
  const row = myBookings.rowFor(room.number);
  await expect(row.getByTestId("status-badge")).toHaveText("Pending");

  // The admin, in a second context with its own storage state
  const adminContext = await browser.newContext({ storageState: ADMIN_STATE });
  const admin = await adminContext.newPage();
  await admin.goto("/admin/bookings");
  await admin
    .getByTestId("booking-row")
    .filter({ hasText: `Room ${room.number}` })
    .getByRole("button", { name: "Approve" })
    .click();
  await expect(
    admin.getByRole("region", { name: "Notifications" }),
  ).toContainText(`Booking for room ${room.number} approved.`);
  await adminContext.close();

  // Back to the guest: no reload, the server pushed the change.
  await expect(row.getByTestId("status-badge")).toHaveText("Confirmed");
  await page.getByRole("button", { name: /^Notifications/ }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Notification centre" })
      .getByTestId("notification")
      .filter({ hasText: `room ${room.number}` }),
  ).toHaveText(`Your booking for room ${room.number} is now confirmed.`);
});

test("admin's unread counter goes up when a guest sends a message", async ({
  browser,
  page,
}) => {
  const adminContext = await browser.newContext({ storageState: ADMIN_STATE });
  const admin = await adminContext.newPage();
  await admin.goto("/admin/messages");
  await expect(admin.getByTestId("message").first()).toBeVisible();

  // Other tests send messages too, so compare with the count before.
  const unread = () => unreadMessages(admin);
  const before = await unread();

  // The guest sends a message from the contact page in the other context.
  // Unique, because the same test runs in other browsers at the same time.
  const subject = `Late arrival ${faker.string.alphanumeric(12)}`;
  await page.goto("/contact");
  await page.getByLabel("Subject", { exact: true }).fill(subject);
  await page.getByLabel("Message", { exact: true }).fill("We will arrive after midnight.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Thank you!")).toBeVisible();

  // The admin's page updates without a reload.
  await expect(
    admin.getByTestId("message").filter({ hasText: subject }),
  ).toBeVisible();
  await expect.poll(unread).toBeGreaterThan(before);
  await adminContext.close();
});
