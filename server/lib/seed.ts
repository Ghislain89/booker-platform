import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

// Deterministic seed data. Dates are relative to today (UTC) so there are always
// past, current and future bookings. Running the seed twice gives the same result.

const DAY = 24 * 60 * 60 * 1000;
const today = () => {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
};
const daysFromToday = (days: number) => new Date(today() + days * DAY);

export const SEED_PASSWORD = "password123";

const users = [
  { username: "admin", email: "admin@example.com", role: "ADMIN" },
  { username: "user", email: "user@example.com", role: "USER" },
];

const rooms = [
  { number: "101", type: "STANDARD", price: 95, capacity: 2, amenities: ["WiFi", "TV", "Desk"] },
  { number: "102", type: "STANDARD", price: 95, capacity: 2, amenities: ["WiFi", "TV", "Safe"] },
  { number: "103", type: "STANDARD", price: 110, capacity: 3, amenities: ["WiFi", "TV", "Desk", "Safe"], featured: true },
  { number: "104", type: "STANDARD", price: 85, capacity: 1, amenities: ["WiFi"], status: "MAINTENANCE" },
  { number: "201", type: "DELUXE", price: 160, capacity: 2, amenities: ["WiFi", "TV", "Mini Bar", "Balcony"], featured: true },
  { number: "202", type: "DELUXE", price: 175, capacity: 3, amenities: ["WiFi", "TV", "Mini Bar", "Ocean View"] },
  { number: "203", type: "DELUXE", price: 175, capacity: 3, amenities: ["WiFi", "TV", "Mini Bar", "Mountain View"] },
  { number: "204", type: "DELUXE", price: 190, capacity: 4, amenities: ["WiFi", "TV", "Mini Bar", "Balcony", "Ocean View"] },
  { number: "301", type: "SUITE", price: 280, capacity: 2, amenities: ["WiFi", "TV", "Mini Bar", "Ocean View", "Jacuzzi"], status: "OCCUPIED" },
  { number: "302", type: "SUITE", price: 320, capacity: 4, amenities: ["WiFi", "TV", "Mini Bar", "Kitchen", "Living Room"], featured: true },
  { number: "303", type: "SUITE", price: 350, capacity: 4, amenities: ["WiFi", "TV", "Mini Bar", "Kitchen", "Living Room", "Balcony"] },
  { number: "304", type: "SUITE", price: 450, capacity: 6, amenities: ["WiFi", "TV", "Mini Bar", "Kitchen", "Living Room", "Jacuzzi", "Ocean View"] },
];

const bookings = [
  { id: "seed-booking-1", username: "user", room: "101", from: -30, to: -27, status: "COMPLETED" },
  { id: "seed-booking-2", username: "user", room: "203", from: -60, to: -58, status: "CANCELLED" },
  { id: "seed-booking-3", username: "user", room: "302", from: 0, to: 3, status: "CONFIRMED", adults: 2, children: 2, extras: ["BREAKFAST"] },
  { id: "seed-booking-4", username: "user", room: "102", from: 7, to: 9, status: "CANCELLED" },
  { id: "seed-booking-5", username: "user", room: "201", from: 14, to: 17, status: "CONFIRMED", adults: 2, extras: ["PARKING", "LATE_CHECKOUT"] },
  { id: "seed-booking-6", username: "user", room: "202", from: 30, to: 32, status: "PENDING", adults: 2, children: 1 },
  { id: "seed-booking-7", username: "admin", room: "301", from: -2, to: 2, status: "CONFIRMED" },
];

const messages = [
  { id: "seed-message-1", username: "user", subject: "Late arrival", content: "We will arrive around 23:00. Is the front desk still open?", status: "UNREAD", daysAgo: 1 },
  { id: "seed-message-2", username: "user", subject: "Extra pillows", content: "Could we get two extra pillows in our room, please?", status: "UNREAD", daysAgo: 2 },
  { id: "seed-message-3", username: "user", subject: "Parking", content: "Is there parking available near the hotel?", status: "READ", daysAgo: 5 },
  { id: "seed-message-4", username: "user", subject: "Invoice", content: "Can you send me the invoice for my last stay?", status: "READ", daysAgo: 20 },
  { id: "seed-message-5", username: "user", subject: "Thank you", content: "Thanks for a great stay!", status: "ARCHIVED", daysAgo: 25 },
];

// Sent with the public contact form: no user, but a name and e-mail address.
const contactMessages = [
  { id: "seed-message-6", name: "Sam Visitor", email: "sam@example.com", subject: "Group booking", content: "Do you offer discounts for groups of ten?", status: "UNREAD", daysAgo: 3 },
];

export async function seedDatabase(prisma: PrismaClient) {
  const password = await bcrypt.hash(SEED_PASSWORD, 10);
  const userIds: Record<string, string> = {};
  for (const user of users) {
    const saved = await prisma.user.upsert({
      where: { username: user.username },
      update: { email: user.email, role: user.role, password, avatarUrl: null },
      create: { ...user, password },
    });
    userIds[user.username] = saved.id;
  }

  const roomIds: Record<string, string> = {};
  for (const [index, { amenities, status = "AVAILABLE", featured = false, ...room }] of rooms.entries()) {
    const data = { ...room, status, featured, amenities: JSON.stringify(amenities), imageUrl: null, position: index + 1 };
    const saved = await prisma.room.upsert({
      where: { number: room.number },
      update: data,
      create: data,
    });
    roomIds[room.number] = saved.id;
  }

  for (const { id, username, room, from, to, status, adults = 1, children = 0, extras = [] } of bookings) {
    const data = {
      adults,
      children,
      extras: JSON.stringify(extras),
      userId: userIds[username],
      roomId: roomIds[room],
      checkIn: daysFromToday(from),
      checkOut: daysFromToday(to),
      status,
    };
    await prisma.booking.upsert({ where: { id }, update: data, create: { id, ...data } });
  }

  for (const { id, username, daysAgo, ...message } of messages) {
    const data = { ...message, userId: userIds[username], createdAt: daysFromToday(-daysAgo) };
    await prisma.message.upsert({ where: { id }, update: data, create: { id, ...data } });
  }
  for (const { id, daysAgo, ...message } of contactMessages) {
    const data = { ...message, createdAt: daysFromToday(-daysAgo) };
    await prisma.message.upsert({ where: { id }, update: data, create: { id, ...data } });
  }

  return {
    users: users.length,
    rooms: rooms.length,
    bookings: bookings.length,
    messages: messages.length + contactMessages.length,
  };
}

/** Removes all data (including branding and reports) and seeds again. */
export async function resetDatabase(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.booking.deleteMany(),
    prisma.message.deleteMany(),
    prisma.report.deleteMany(),
    prisma.branding.deleteMany(),
    prisma.room.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  return seedDatabase(prisma);
}
