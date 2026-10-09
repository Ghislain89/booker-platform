// Assignment 5, option "Dialogs and downloads".
import { readFile } from "node:fs/promises";
import { test, expect } from "../../support/fixtures/ui.fixture";

test("user downloads the PDF invoice of a booking", async ({
  page,
  seed,
  myBookings,
}) => {
  const { rooms } = await seed({
    rooms: [{ number: "401", type: "DELUXE", price: 150, capacity: 2 }],
    bookings: [
      { user: "user", room: "401", checkIn: "2031-10-01", checkOut: "2031-10-03" },
    ],
  });
  const room = rooms[0];

  await myBookings.goto();
  const downloadPromise = page.waitForEvent("download");
  await myBookings
    .rowFor(room.number)
    .getByRole("button", { name: `Download PDF invoice for room ${room.number}` })
    .click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe(
    `invoice-room-${room.number}-2031-10-01.pdf`,
  );
  const file = await readFile(await download.path());
  expect(file.subarray(0, 5).toString()).toBe("%PDF-");
});

test("user downloads the CSV invoice and checks the total", async ({
  page,
  seed,
  myBookings,
}) => {
  const { rooms } = await seed({
    rooms: [{ number: "402", type: "DELUXE", price: 150, capacity: 2 }],
    bookings: [
      { user: "user", room: "402", checkIn: "2031-10-05", checkOut: "2031-10-07" },
    ],
  });
  const room = rooms[0];

  await myBookings.goto();
  const downloadPromise = page.waitForEvent("download");
  await myBookings
    .rowFor(room.number)
    .getByRole("button", { name: `Download CSV invoice for room ${room.number}` })
    .click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.csv$/);
  const csv = await readFile(await download.path(), "utf8");
  expect(csv).toContain(`Room ${room.number}`);
  expect(csv).toMatch(/Total.*300/);
});

test("cancelled bookings have no invoice", async ({ page, seed, myBookings }) => {
  const { rooms } = await seed({
    rooms: [{ number: "403", type: "STANDARD", price: 90, capacity: 2 }],
    bookings: [
      { user: "user", room: "403", checkIn: "2031-10-10", checkOut: "2031-10-12" },
    ],
  });
  const room = rooms[0];

  await myBookings.goto();
  const dialog = page.waitForEvent("dialog");
  await myBookings.cancel(room.number);
  expect((await dialog).type()).toBe("confirm");

  await myBookings.openTab("Cancelled");
  const row = myBookings.rowFor(room.number);
  await expect(row.getByTestId("status-badge")).toHaveText("Cancelled");
  await expect(row.getByRole("button", { name: /invoice/ })).toHaveCount(0);
});
