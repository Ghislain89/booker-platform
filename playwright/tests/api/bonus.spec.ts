import { test } from "../../support/fixtures/test.fixture";
import { expect } from "../../support/fixtures/expect.fixture";
import { createRandomRoom } from "../../support/datafactories/room.factory";
import { createRandomBooking } from "../../support/datafactories/booking.factory";
import { createRandomUser } from "../../support/datafactories/user.factory";
import {
  getApiRoomsResponse,
  getApiRoomsIdResponse,
} from "../../support/zod/zod/rooms";
import {
  getApiBookingsIdResponse,
  deleteApiBookingsIdResponse,
} from "../../support/zod/zod/bookings";

test.describe("Bonus: Improve the overall setup", () => {
  let adminToken: string;
  let userToken: string;
  const adminUser = { username: "admin", password: "password123" };

  test.beforeEach(async ({ api }) => {
    const { statusCode, responseBody } = await api.post("auth/login", {
      username: adminUser.username,
      password: adminUser.password,
    });
    expect(statusCode).toBe(200);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data).toHaveProperty("token");
    adminToken = responseBody.data.token;
  });

  test("Assignment 1: /auth", async ({ api }) => {
    const user = createRandomUser();

    await test.step("Register a new regular user", async () => {
      const { statusCode, responseBody } = await api.post(
        "auth/register",
        user,
      );
      expect(statusCode).toBe(201);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toHaveProperty("token");
      expect(responseBody.data).toHaveProperty("user");
      expect(responseBody.data.user).toHaveProperty("role");
    });

    await test.step("Login as the newly created regular user", async () => {
      const { statusCode, responseBody } = await api.post("auth/login", {
        username: user.username,
        password: user.password,
      });
      expect(statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toHaveProperty("token");
      expect(responseBody.data).toHaveProperty("user");
      expect(responseBody.data.user).toHaveProperty("username", user.username);
      expect(responseBody.data.user).toHaveProperty("role");
      userToken = responseBody.data.token;
    });
  });

  test("Assignment 2: /Rooms & /Booking", async ({ api }) => {
    const user = createRandomUser();
    const room = await createRandomRoom();
    let createdRoom: any = {};
    let booking: any = {};

    await test.step("Register a new regular user", async () => {
      const { statusCode, responseBody } = await api.post(
        "auth/register",
        user,
      );
      expect(statusCode).toBe(201);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toHaveProperty("token");
      expect(responseBody.data).toHaveProperty("user");
      expect(responseBody.data.user).toHaveProperty("role");
    });

    await test.step("Login as the newly created regular user", async () => {
      const { statusCode, responseBody } = await api.post("auth/login", {
        username: user.username,
        password: user.password,
      });
      expect(statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toHaveProperty("token");
      expect(responseBody.data).toHaveProperty("user");
      expect(responseBody.data.user).toHaveProperty("username", user.username);
      expect(responseBody.data.user).toHaveProperty("role");
      userToken = responseBody.data.token;
    });

    await test.step("Retrieve list of available rooms", async () => {
      const { statusCode, responseBody } = await api.get(
        "rooms",
        userToken,
      );
      expect(statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      await expect(responseBody).toMatchSchema(getApiRoomsResponse);
    });

    await test.step("Create a new room as admin", async () => {
      const { statusCode, responseBody } = await api.post(
        "rooms",
        room,
        adminToken,
      );
      createdRoom = responseBody.data;
      expect(statusCode).toBe(201);
      expect(responseBody.success).toBe(true);
      await expect(responseBody).toMatchSchema(getApiRoomsIdResponse);
    });

    await test.step("Verify the newly created room details", async () => {
      const { statusCode, responseBody } = await api.get(
        `rooms/${createdRoom.id}`,
        userToken,
      );
      expect(statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      await expect(responseBody).toMatchSchema(getApiRoomsIdResponse);
    });

    await test.step("Create a new booking for the room", async () => {
      const randomBooking = await createRandomBooking(
        createdRoom.id,
        "2025-03-05",
        "2025-03-07",
      );

      const { statusCode, responseBody } = await api.post(
        "bookings",
        randomBooking,
        userToken,
      );
      booking = responseBody.data;
      expect(statusCode).toBe(201);
      expect(responseBody.success).toBe(true);
      await expect(responseBody).toMatchSchema(getApiBookingsIdResponse);
    });

    await test.step("Retrieve the booking details", async () => {
      const { statusCode, responseBody } = await api.get(
        `bookings/${booking.id}`,
        userToken,
      );
      expect(statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      await expect(responseBody).toMatchSchema(getApiBookingsIdResponse);
    });

    await test.step("Cancel the created booking", async () => {
      const { statusCode, responseBody } = await api.delete(
        `bookings/${booking.id}`,
        userToken,
      );
      expect(statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.message).toBe("Booking cancelled successfully");
      await expect(responseBody).toMatchSchema(deleteApiBookingsIdResponse);
    });

    await test.step("Verify the booking status is cancelled", async () => {
      const { statusCode, responseBody } = await api.get(
        `bookings/${booking.id}`,
        userToken,
      );
      expect(statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
    });
  });
});
