import express from "express";
import { Booking } from "../types";
import { bookingsController } from "../controllers/bookings";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import { BookingStatus } from "@prisma/client";

const router = express.Router();

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       roomId:
 *                         type: string
 *                       checkIn:
 *                         type: string
 *                         format: date-time
 *                       checkOut:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *                       totalPrice:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const bookings = await bookingsController.getAll();
    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch bookings",
    });
  }
});

// Get user's bookings
router.get("/my-bookings", authenticate, async (req, res) => {
  try {
    const bookings = await bookingsController.getUserBookings(req.user!.userId);
    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch user bookings",
    });
  }
});

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     roomId:
 *                       type: string
 *                     checkIn:
 *                       type: string
 *                       format: date-time
 *                     checkOut:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *                     totalPrice:
 *                       type: number
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const booking = await bookingsController.getById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }
    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch booking",
    });
  }
});

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - checkIn
 *               - checkOut
 *             properties:
 *               roomId:
 *                 type: string
 *                 example: "room-id-123"
 *               checkIn:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-04-01T14:00:00Z"
 *               checkOut:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-04-05T12:00:00Z"
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     roomId:
 *                       type: string
 *                     checkIn:
 *                       type: string
 *                       format: date-time
 *                     checkOut:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       enum: [PENDING]
 *                     totalPrice:
 *                       type: number
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid booking data
 *       401:
 *         description: Unauthorized
 */
router.post("/", authenticate, async (req, res) => {
  try {
    console.log("Creating booking with data:", {
      requestBody: req.body,
      userId: req.user?.userId,
    });

    const booking = await bookingsController.create({
      ...req.body,
      userId: req.user!.userId,
    });

    console.log("Booking created successfully:", booking);

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Failed to create booking:", error);
    res.status(400).json({
      success: false,
      error: "Failed to create booking",
    });
  }
});

/**
 * @swagger
 * /api/bookings/{id}:
 *   put:
 *     summary: Update booking status (admin only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *                 example: "CONFIRMED"
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Booking not found
 *       403:
 *         description: Forbidden - Admin access required
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const booking = await bookingsController.update(req.params.id, req.body);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }
    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update booking",
    });
  }
});

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Cancel booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    console.log("Attempting to cancel booking:", {
      bookingId: req.params.id,
      userId: req.user?.userId,
    });

    const success = await bookingsController.cancelBooking(
      req.params.id,
      req.user!.userId,
    );

    console.log("Cancel booking result:", {
      success,
      bookingId: req.params.id,
    });

    if (!success) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }
    res.json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Failed to cancel booking:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel booking",
    });
  }
});

export default router;
