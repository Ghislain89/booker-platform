import express from "express";
import { bookingsController } from "../controllers/bookings";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import { asyncHandler, conflict, HttpError } from "../lib/http";
import { invoiceCsv, invoiceFileName, invoicePdf } from "../lib/invoice";
import { brandingService } from "../services/branding";
import { hasFlag } from "../lib/flags";
import { asBody, Validator } from "../lib/validation";
import { EXTRAS, Extra } from "../lib/pricing";
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

router.get("/:id/invoice", authenticate, asyncHandler(async (req, res) => {
  const format = req.query.format ?? "pdf";
  if (format !== "pdf" && format !== "csv") {
    throw new HttpError(400, "Validation failed", { format: "format must be pdf or csv" });
  }
  const booking = await bookingsController.getById(req.params.id, req.user!);
  if (booking.status === "CANCELLED") throw conflict("Cancelled bookings have no invoice");
  res.setHeader("Content-Disposition", `attachment; filename="${invoiceFileName(booking, format)}"`);
  if (format === "csv") {
    res.type("text/csv").send(invoiceCsv(booking));
  } else {
    const { name } = await brandingService.get();
    res.type("application/pdf").send(invoicePdf(booking, name));
  }
}));

router.post("/", authenticate, asyncHandler(async (req, res) => {
  const v = new Validator(asBody(req.body));
  const roomId = v.string("roomId");
  const checkIn = v.date("checkIn");
  const checkOut = v.date("checkOut");
  const adults = v.number("adults", { required: false, min: 1, max: 10, integer: true });
  const children = v.number("children", { required: false, min: 0, max: 10, integer: true });
  const extras = v.stringArray("extras");
  if (extras?.some((extra) => !(EXTRAS as readonly string[]).includes(extra))) {
    v.error("extras", `extras may only contain ${EXTRAS.join(", ")}`);
  }
  v.assertValid();

  if (hasFlag(req, "flaky-booking") && Math.random() < 0.3) {
    throw new HttpError(500, "Something went wrong!");
  }

  const booking = await bookingsController.create(
    { roomId: roomId!, checkIn: checkIn!, checkOut: checkOut!, adults, children, extras: extras as Extra[] | undefined },
    req.user!.userId,
  );
  res.status(201).json({ success: true, data: booking });
}));

router.put("/:id", authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
  const v = new Validator(asBody(req.body));
  const status = v.oneOf("status", BOOKING_STATUSES);
  v.assertValid();

  const booking = await bookingsController.updateStatus(req.params.id, status!, req.user!.username);
  res.json({ success: true, data: booking });
}));

router.delete("/:id", authenticate, asyncHandler(async (req, res) => {
  await bookingsController.cancel(req.params.id, req.user!);
  res.json({ success: true, message: "Booking cancelled successfully" });
}));

export default router;
