// Generated with the Playwright test agents (planner + generator) from
// specs/cancel-booking.md, then reviewed: the agent's `nth()` locator and fixed
// room number were replaced by a seeded room, so the test runs in parallel.
import { test, expect } from "../../support/fixtures/ui.fixture";

test.describe("Cancel a booking", () => {
  test("user cancels an upcoming booking", async ({
    page,
    seed,
    myBookings,
  }) => {
    const { rooms } = await seed({
      rooms: [{ number: "301", type: "SUITE", price: 250, capacity: 2 }],
      bookings: [
        {
          user: "user",
          room: "301",
          checkIn: "2031-09-01",
          checkOut: "2031-09-05",
        },
      ],
    });
    const room = rooms[0];

    await myBookings.goto();
    const row = myBookings.rowFor(room.number);
    await expect(row.getByTestId("status-badge")).toHaveText("Confirmed");

    const dialog = page.waitForEvent("dialog");
    await myBookings.cancel(room.number);
    expect((await dialog).message()).toContain(
      `Cancel your booking for room ${room.number}`,
    );

    await expect(
      page.getByRole("region", { name: "Notifications" }),
    ).toContainText("Booking cancelled.");
    await expect(row).toBeHidden();

    await myBookings.openTab("Cancelled");
    await expect(row.getByTestId("status-badge")).toHaveText("Cancelled");
  });

  test("user keeps the booking when dismissing the confirm dialog", async ({
    page,
    seed,
    myBookings,
  }) => {
    const { rooms } = await seed({
      rooms: [{ number: "302", type: "SUITE", price: 250, capacity: 2 }],
      bookings: [
        {
          user: "user",
          room: "302",
          checkIn: "2031-09-10",
          checkOut: "2031-09-12",
        },
      ],
    });
    const room = rooms[0];

    await myBookings.goto();
    page.once("dialog", (dialog) => dialog.dismiss());
    await myBookings
      .rowFor(room.number)
      .getByRole("button", { name: "Cancel booking" })
      .click();

    await expect(
      myBookings.rowFor(room.number).getByTestId("status-badge"),
    ).toHaveText("Confirmed");
  });
});
