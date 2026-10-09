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
    const response = await request.post("auth/login", {
      data: adminUser,
    });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.data).toHaveProperty("token");
    adminToken = responseBody.data.token;
  });

  await test.step("Register a new regular user", async () => {
    const response = await request.post("auth/register", {
      data: user,
    });

    const responseBody = await response.json();

    expect(response.status()).toBe(201);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data).toHaveProperty("token");
    expect(responseBody.data).toHaveProperty("user");
    expect(responseBody.data.user).toHaveProperty("role");
  });

  await test.step("Login as the newly created regular user", async () => {
    const response = await request.post("auth/login", {
      data: { username: user.username, password: user.password },
    });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.data).toHaveProperty("token");
    expect(responseBody.data).toHaveProperty("user");
    expect(responseBody.data.user).toHaveProperty("username", user.username);
    expect(responseBody.data.user).toHaveProperty("role");

    userToken = responseBody.data.token;
  });

  await test.step("Retrieve list of available rooms", async () => {
    const response = await request.get("rooms", {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(response.status()).toBe(200);

    const responseJson = await response.json();
    expect(responseJson.success).toBe(true);
    expect(responseJson.data[0]).toHaveProperty("number");
    expect(responseJson.data[0]).toHaveProperty("type");
    expect(responseJson.data[0]).toHaveProperty("price");
    expect(responseJson.data[0]).toHaveProperty("capacity");
    expect(responseJson.data[0]).toHaveProperty("amenities");
  });

  await test.step("Create a new room as admin", async () => {
    const response = await request.post("rooms", {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: room,
    });
    expect(response.status()).toBe(201);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    createdRoom = responseBody.data;

    expect(createdRoom.number).toEqual(room.number);
    expect(createdRoom.type).toEqual(room.type);
    expect(createdRoom.price).toEqual(room.price);
    expect(createdRoom.capacity).toEqual(room.capacity);
    expect(createdRoom.amenities).toEqual(room.amenities);
  });

  await test.step("Verify the newly created room details", async () => {
    const response = await request.get(`rooms/${createdRoom.id}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.number).toEqual(createdRoom.number);
    expect(responseBody.data.type).toEqual(createdRoom.type);
    expect(responseBody.data.price).toEqual(createdRoom.price);
    expect(responseBody.data.capacity).toEqual(createdRoom.capacity);
    expect(responseBody.data.amenities).toEqual(room.amenities);
  });

  await test.step("Create a new booking for the room", async () => {
    const bookingData = await createRandomBooking(createdRoom.id);

    const response = await request.post("bookings", {
      headers: { Authorization: `Bearer ${userToken}` },
      data: bookingData,
    });
    expect(response.status()).toBe(201);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    booking = responseBody.data;
    expect(booking.roomId).toEqual(createdRoom.id);
  });

  await test.step("Cancel the created booking", async () => {
    const response = await request.delete(`bookings/${booking.id}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
  });

  await test.step("Verify the booking status is cancelled", async () => {
    const response = await request.get(`bookings/${booking.id}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.status).toBe("CANCELLED");
  });
});
