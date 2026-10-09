import { test, expect } from "../../support/fixtures/ui.fixture";

test("admin approves a pending booking", async ({
  page,
  seed,
  request,
  userToken,
}) => {
  const { rooms, bookings } = await seed({
    rooms: [{ number: "201", type: "DELUXE", price: 180, capacity: 2 }],
    bookings: [
      {
        user: "user",
        room: "201",
        checkIn: "2031-11-01",
        checkOut: "2031-11-04",
        status: "PENDING",
      },
    ],
  });
  const room = rooms[0];

  await page.goto("/admin/bookings");
  await expect(page.getByLabel("Status")).toHaveValue("PENDING");
  const row = page
    .getByTestId("booking-row")
    .filter({ hasText: `Room ${room.number}` });
  await expect(row).toContainText("€ 540");
  await row.getByRole("button", { name: "Approve" }).click();

  await expect(
    page.getByRole("region", { name: "Notifications" }),
  ).toContainText(`Booking for room ${room.number} approved.`);
  await expect(row).toBeHidden();

  // The guest sees the new status through the API
  const response = await request.get(`/api/bookings/${bookings[0].id}`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  await expect(response).toBeOK();
  expect((await response.json()).data.status).toBe("CONFIRMED");
});
