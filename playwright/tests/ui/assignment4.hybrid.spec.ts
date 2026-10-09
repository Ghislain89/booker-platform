import { test, expect } from "../../support/fixtures/ui.fixture";
import { createRandomRoom } from "../../support/datafactories/room.factory";
import { createRandomBooking } from "../../support/datafactories/booking.factory";

test("Assignment 4: a booking created through the API shows up in My bookings", async ({
  request,
  adminToken,
  userToken,
  myBookings,
}) => {
  const room = await test.step("create a room as admin", async () => {
    const response = await request.post("/api/rooms", {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: await createRandomRoom(),
    });
    await expect(response).toBeOK();
    return (await response.json()).data;
  });

  await test.step("book the room as user", async () => {
    const response = await request.post("/api/bookings", {
      headers: { Authorization: `Bearer ${userToken}` },
      data: await createRandomBooking(room.id, "2031-06-01", "2031-06-03"),
    });
    await expect(response).toBeOK();
  });

  await test.step("verify the booking in the UI", async () => {
    await myBookings.goto();
    const row = myBookings.rowFor(room.number);
    await expect(row).toContainText("June 1, 2031");
    await expect(row).toContainText("June 3, 2031");
    await expect(row.getByTestId("status-badge")).toHaveText("Pending");
  });
});

// Bonus: the `seed` fixture creates the room through the test support API and
// cleans it up afterwards.
test("Assignment 4: a booking made in the UI is stored by the API", async ({
  request,
  seed,
  userToken,
  bookingWizard,
  page,
}) => {
  const { rooms } = await seed({
    rooms: [{ number: "201", type: "STANDARD", price: 100, capacity: 2 }],
  });
  const room = rooms[0];

  await bookingWizard.goto(room.number);
  await bookingWizard.book({
    checkIn: "2031-07-10",
    checkOut: "2031-07-12",
    adults: 2,
    extras: ["Late check-out"],
  });
  await expect(page).toHaveURL(/\/my\/bookings$/);

  const response = await request.get("/api/bookings/my-bookings", {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  await expect(response).toBeOK();
  const { data } = await response.json();
  const booking = data.find(
    (item: { roomId: string }) => item.roomId === room.id,
  );

  expect(booking).toMatchObject({
    status: "PENDING",
    adults: 2,
    children: 0,
    extras: ["LATE_CHECKOUT"],
    nights: 2,
    totalPrice: 225, // 2 nights × € 100 + late check-out € 25
  });
  expect(booking.checkIn).toContain("2031-07-10");
});
