import express from "express";
import { roomsController } from "../controllers/rooms";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import { asyncHandler } from "../lib/http";
import { hasFlag, sleep } from "../lib/flags";
import { asBody, Validator } from "../lib/validation";
import { ROOM_STATUSES, ROOM_TYPES, RoomInput } from "../types";

const router = express.Router();

const readRoom = (body: unknown, required: boolean): Partial<RoomInput> => {
  const v = new Validator(asBody(body));
  const room = {
    number: v.string("number", { required, max: 20 }),
    type: v.oneOf("type", ROOM_TYPES, { required }),
    price: v.number("price", { required, min: 0 }),
    capacity: v.number("capacity", { required, min: 1, max: 10, integer: true }),
    amenities: v.stringArray("amenities"),
    status: v.oneOf("status", ROOM_STATUSES, { required: false }),
  };
  v.assertValid();
  return Object.fromEntries(Object.entries(room).filter(([, value]) => value !== undefined));
};

router.get("/", authenticate, asyncHandler(async (req, res) => {
  if (hasFlag(req, "slow-rooms")) await sleep(1000 + Math.random() * 2000);
  const rooms = await roomsController.getAll({ shuffle: hasFlag(req, "random-order") });
  res.json({ success: true, data: rooms });
}));

router.get("/:id", authenticate, asyncHandler(async (req, res) => {
  const room = await roomsController.getById(req.params.id);
  res.json({ success: true, data: room });
}));

router.post("/", authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
  const room = await roomsController.create(readRoom(req.body, true) as RoomInput);
  res.status(201).json({ success: true, data: room });
}));

router.put("/:id", authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
  const room = await roomsController.update(req.params.id, readRoom(req.body, false));
  res.json({ success: true, data: room });
}));

router.delete("/:id", authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
  await roomsController.delete(req.params.id);
  res.json({ success: true, message: "Room deleted successfully" });
}));

export default router;
