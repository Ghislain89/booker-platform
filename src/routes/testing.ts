import express from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { asyncHandler, badRequest } from "../lib/http";
import { FLAGS, getGlobalFlags, isFlag, setGlobalFlags } from "../lib/flags";
import { resetDatabase } from "../lib/seed";
import { asBody, Validator } from "../lib/validation";
import { issueToken } from "../services/auth";
import { toRoom } from "../services/rooms";
import { bookingInclude, toBooking } from "../services/bookings";
import { BOOKING_STATUSES, ROOM_STATUSES, ROOM_TYPES } from "../types";

// Test-support endpoints. Only mounted when TEST_API_ENABLED (see src/config/env.ts).

const router = express.Router();

const NAMESPACE_PATTERN = /^[A-Za-z0-9_]{1,30}$/;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);


router.post("/reset", asyncHandler(async (req, res) => {
  setGlobalFlags([]);
  const counts = await resetDatabase(prisma);
  res.json({ success: true, data: counts });
}));

router.post("/seed", asyncHandler(async (req, res) => {
  const body = asBody(req.body);
  const v = new Validator(body);
  const namespace = v.string("namespace", {
    max: 30,
    pattern: NAMESPACE_PATTERN,
    patternMessage: "namespace may only contain letters, digits and '_'",
  });
  v.assertValid();
  const prefix = `${namespace}-`;

  const userInputs = asArray(body.users).map((item, index) => {
    const u = new Validator(asBody(item));
    const user = {
      username: u.string("username", { max: 50 }),
      password: u.string("password", { required: false, max: 100 }) ?? "password123",
      email: u.string("email", { required: false, max: 254 }),
      role: u.oneOf("role", ["USER", "ADMIN"] as const, { required: false }) ?? "USER",
    };
    for (const [field, message] of Object.entries(u.errors)) v.error(`users[${index}].${field}`, message);
    return user;
  });

  const roomInputs = asArray(body.rooms).map((item, index) => {
    const r = new Validator(asBody(item));
    const room = {
      number: r.string("number", { max: 20 }),
      type: r.oneOf("type", ROOM_TYPES),
      price: r.number("price", { min: 0 }),
      capacity: r.number("capacity", { min: 1, max: 10, integer: true }),
      amenities: r.stringArray("amenities") ?? [],
      status: r.oneOf("status", ROOM_STATUSES, { required: false }) ?? "AVAILABLE",
    };
    for (const [field, message] of Object.entries(r.errors)) v.error(`rooms[${index}].${field}`, message);
    return room;
  });

  const bookingInputs = asArray(body.bookings).map((item, index) => {
    const b = new Validator(asBody(item));
    const booking = {
      user: b.string("user"),
      room: b.string("room"),
      checkIn: b.date("checkIn"),
      checkOut: b.date("checkOut"),
      status: b.oneOf("status", BOOKING_STATUSES, { required: false }) ?? "CONFIRMED",
    };
    for (const [field, message] of Object.entries(b.errors)) v.error(`bookings[${index}].${field}`, message);
    return booking;
  });
  v.assertValid();

  const users = [];
  for (const input of userInputs) {
    const username = prefix + input.username;
    const data = {
      email: input.email ?? `${username}@booker.test`,
      password: await bcrypt.hash(input.password, 10),
      role: input.role,
    };
    const user = await prisma.user.upsert({
      where: { username },
      update: data,
      create: { username, ...data },
    });
    users.push({ ...issueToken(user), password: input.password });
  }

  const rooms = [];
  for (const input of roomInputs) {
    const data = {
      number: prefix + input.number,
      type: input.type!,
      price: input.price!,
      capacity: input.capacity!,
      status: input.status,
      amenities: JSON.stringify(input.amenities),
    };
    const room = await prisma.room.upsert({
      where: { number: data.number },
      update: data,
      create: data,
    });
    rooms.push(toRoom(room));
  }

  const bookings = [];
  for (const [index, input] of bookingInputs.entries()) {
    const user =
      (await prisma.user.findUnique({ where: { username: prefix + input.user } })) ??
      (await prisma.user.findUnique({ where: { username: input.user! } }));
    const room =
      (await prisma.room.findUnique({ where: { number: prefix + input.room } })) ??
      (await prisma.room.findUnique({ where: { number: input.room! } }));
    if (!user || !room) {
      throw badRequest({
        [`bookings[${index}]`]: !user ? `Unknown user '${input.user}'` : `Unknown room '${input.room}'`,
      });
    }
    bookings.push(
      toBooking(await prisma.booking.create({
        data: {
          userId: user.id,
          roomId: room.id,
          checkIn: input.checkIn!,
          checkOut: input.checkOut!,
          status: input.status,
        },
        include: bookingInclude,
      })),
    );
  }

  res.status(201).json({ success: true, data: { namespace, users, rooms, bookings } });
}));

router.delete("/namespace/:namespace", asyncHandler(async (req, res) => {
  const { namespace } = req.params;
  if (!NAMESPACE_PATTERN.test(namespace)) {
    throw badRequest({ namespace: "namespace may only contain letters, digits and '_'" });
  }
  const prefix = `${namespace}-`;

  const users = await prisma.user.findMany({ where: { username: { startsWith: prefix } }, select: { id: true } });
  const rooms = await prisma.room.findMany({ where: { number: { startsWith: prefix } }, select: { id: true } });
  const userIds = users.map((user) => user.id);
  const roomIds = rooms.map((room) => room.id);

  const [bookings, messages, deletedUsers, deletedRooms] = await prisma.$transaction([
    prisma.booking.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { roomId: { in: roomIds } }] } }),
    prisma.message.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
    prisma.room.deleteMany({ where: { id: { in: roomIds } } }),
  ]);

  res.json({
    success: true,
    data: {
      users: deletedUsers.count,
      rooms: deletedRooms.count,
      bookings: bookings.count,
      messages: messages.count,
    },
  });
}));

router.get("/flags", (req, res) => {
  res.json({ success: true, data: { enabled: getGlobalFlags(), available: FLAGS } });
});

router.put("/flags", asyncHandler(async (req, res) => {
  const v = new Validator(asBody(req.body));
  const flags = v.stringArray("flags", { required: true });
  v.assertValid();
  const unknown = flags!.filter((flag) => !isFlag(flag));
  if (unknown.length > 0) {
    throw badRequest({ flags: `Unknown flag(s): ${unknown.join(", ")}. Available: ${FLAGS.join(", ")}` });
  }
  setGlobalFlags(flags!.filter(isFlag));
  res.json({ success: true, data: { enabled: getGlobalFlags(), available: FLAGS } });
}));

export default router;
