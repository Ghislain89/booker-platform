// Assignment 5, option "Clock": check-in opens at 15:00 on the day of arrival.
import { test, expect } from "../../support/fixtures/ui.fixture";

/** yyyy-mm-dd in local time, the same "today" the browser uses. */
const localDate = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

test("check-in countdown opens at 15:00", async ({ page, seed, myBookings }) => {
  const today = localDate(new Date());
  const later = new Date();
  later.setDate(later.getDate() + 2);
  const { rooms } = await seed({
    rooms: [{ number: "601", type: "STANDARD", price: 90, capacity: 2 }],
    bookings: [
      { user: "user", room: "601", checkIn: today, checkOut: localDate(later) },
    ],
  });
  const room = rooms[0];

  // setFixedTime fixes Date.now() but keeps timers running, so the page (and its
  // one-second countdown timer) works as usual. install() + pauseAt() would also
  // stop the timers the app needs to render the bookings.
  await page.clock.setFixedTime(new Date(`${today}T14:59:50`));
  await myBookings.goto();

  const countdown = page
    .getByTestId("check-in-countdown")
    .filter({ hasText: `room ${room.number} ` });
  await expect(countdown).toHaveText(
    `Check-in for room ${room.number} opens in 00:00:10`,
  );

  await page.clock.setFixedTime(new Date(`${today}T14:59:57`));
  await expect(countdown).toHaveText(
    `Check-in for room ${room.number} opens in 00:00:03`,
  );

  await page.clock.setFixedTime(new Date(`${today}T15:00:00`));
  await expect(countdown).toHaveText(`Check-in for room ${room.number} is open`);
});

test("no countdown for a booking that starts tomorrow", async ({
  page,
  seed,
  myBookings,
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const later = new Date();
  later.setDate(later.getDate() + 3);
  const { rooms } = await seed({
    rooms: [{ number: "602", type: "STANDARD", price: 90, capacity: 2 }],
    bookings: [
      {
        user: "user",
        room: "602",
        checkIn: localDate(tomorrow),
        checkOut: localDate(later),
      },
    ],
  });
  const room = rooms[0];

  await page.clock.setFixedTime(new Date(`${localDate(new Date())}T14:59:00`));
  await myBookings.goto();
  await expect(myBookings.rowFor(room.number)).toBeVisible();
  await expect(
    page.getByTestId("check-in-countdown").filter({ hasText: `room ${room.number} ` }),
  ).toHaveCount(0);
});
