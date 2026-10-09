import { test, expect } from "../../support/fixtures/ui.fixture";
import { createRandomUser } from "../../support/datafactories/user.factory";
import { LOGGED_OUT } from "../../support/auth";

test.use({ storageState: LOGGED_OUT });

test("Assignment 2: register and log in with page objects", async ({
  page,
  registerPage,
  loginPage,
  myBookings,
}) => {
  const user = createRandomUser();

  await registerPage.goto();
  await registerPage.register(user);
  await expect(loginPage.heading).toBeVisible();

  await loginPage.login(user.username, user.password);
  await expect(myBookings.heading).toBeVisible();
  await expect(myBookings.emptyState).toBeVisible();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
});

test("Assignment 2 bonus: book a room with the booking wizard", async ({
  page,
  seed,
  registerPage,
  loginPage,
  bookingWizard,
  myBookings,
}) => {
  const user = createRandomUser();
  const { rooms } = await seed({
    rooms: [{ number: "101", type: "DELUXE", price: 150, capacity: 3 }],
  });
  const room = rooms[0];

  await registerPage.goto();
  await registerPage.register(user);
  // Wait for the redirect, or login() starts typing on the register page
  await expect(loginPage.heading).toBeVisible();
  await loginPage.login(user.username, user.password);
  await expect(myBookings.emptyState).toBeVisible();

  await bookingWizard.goto(room.number);
  await expect(
    page.getByRole("heading", { name: `Book room ${room.number}` }),
  ).toBeVisible();
  await bookingWizard.fillDatesAndGuests({
    checkIn: "2031-06-01",
    checkOut: "2031-06-04",
    adults: 2,
    children: 1,
  });
  await bookingWizard.chooseExtras(["Breakfast", "Parking"]);

  // 3 nights × € 150 + breakfast (€ 15 × 3 guests × 3 nights) + parking (€ 12 × 3 nights)
  await expect(bookingWizard.totalPrice).toHaveText("€ 621");
  await expect(bookingWizard.confirm).toBeDisabled();
  await bookingWizard.confirmBooking();

  await expect(page).toHaveURL(/\/my\/bookings$/);
  await expect(
    page.getByRole("region", { name: "Notifications" }),
  ).toContainText("Booking received");
  const row = myBookings.rowFor(room.number);
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("June 1, 2031");
  await expect(row).toContainText("June 4, 2031");
  await expect(row).toContainText("€ 621");
  await expect(row.getByTestId("status-badge")).toHaveText("Pending");
});
