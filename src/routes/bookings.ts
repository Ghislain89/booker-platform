import express from "express";
import { bookingsController } from "../controllers/bookings";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import { asyncHandler, HttpError } from "../lib/http";
import { hasFlag } from "../lib/flags";
import { asBody, Validator } from "../lib/validation";
import { BOOKING_STATUSES } from "../types";

const router = express.Router();

router.get("/", authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
  const bookings = await bookingsController.getAll();
  res.json({ success: true, data: bookings });
}));

router.get("/my-bookings", authenticate, asyncHandler(async (req, res) => {
  const bookings = await bookingsController.getUserBookings(req.user!.userId);
  res.json({ success: true, data: bookings });
}));

router.get("/:id", authenticate, asyncHandler(async (req, res) => {
  const booking = await bookingsController.getById(req.params.id, req.user!);
  res.json({ success: true, data: booking });
}));

router.post("/", authenticate, asyncHandler(async (req, res) => {
  const v = new Validator(asBody(req.body));
  const roomId = v.string("roomId");
  const checkIn = v.date("checkIn");
  const checkOut = v.date("checkOut");
  v.assertValid();

  if (hasFlag(req, "flaky-booking") && Math.random() < 0.3) {
    throw new HttpError(500, "Something went wrong!");
  }

  const booking = await bookingsController.create(
    { roomId: roomId!, checkIn: checkIn!, checkOut: checkOut! },
    req.user!.userId,
  );
  res.status(201).json({ success: true, data: booking });
}));

router.put("/:id", authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
  const v = new Validator(asBody(req.body));
  const status = v.oneOf("status", BOOKING_STATUSES);
  v.assertValid();

  const booking = await bookingsController.updateStatus(req.params.id, status!);
  res.json({ success: true, data: booking });
}));

router.delete("/:id", authenticate, asyncHandler(async (req, res) => {
  await bookingsController.cancel(req.params.id, req.user!);
  res.json({ success: true, message: "Booking cancelled successfully" });
}));

export default router;
