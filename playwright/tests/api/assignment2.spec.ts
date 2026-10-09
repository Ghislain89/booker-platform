import { test, expect } from "@playwright/test";
import { createRandomRoom } from "../../support/datafactories/room.factory";
import { createRandomBooking } from "../../support/datafactories/booking.factory";
import { createRandomUser } from "../../support/datafactories/user.factory";

test("Assignment 2: Rooms & Booking", async ({ request }) => {
  const adminUser = { username: "admin", password: "password123" };
  let adminToken: string;
  let userToken: string;
  const user = await createRandomUser();
  const room = await createRandomRoom();
  let createdRoom: any = {};
  let booking: any = {};

  await test.step("Login as admin user to get admin privileges", async () => {
    // Login as the admin user and store the token in a variable
  });

  await test.step("Register a new regular user", async () => {
    // Register a new regular user
  });

  await test.step("Login as the newly created regular user", async () => {
    // Login as the new user and store the token in a variable
  });

  await test.step("Retrieve list of available rooms", async () => {
    // Get a list of available Rooms.
  });

  await test.step("Create a new room as admin", async () => {
    // Decide the available rooms are not to your liking and create a new one!
  });

  await test.step("Verify the newly created room details", async () => {
    // Create a new room, to do this, you can use the CreateRandomRoom() function (it should already be imported)
  });

  await test.step("Create a new booking for the room", async () => {
    // Create a new booking for the room you just created.  A convenience function createRandomBooking() is present and should already be imported.
  });

  await test.step("Cancel the created booking", async () => {
    // Cancel the booking you just created, the kids have the flu. We're not going.
  });

  await test.step("Verify the booking status is cancelled", async () => {
    // Verify that the booking is actually cancelled.
  });
});
