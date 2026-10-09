import { Booking as DbBooking, Room as DbRoom } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { badRequest, conflict, forbidden, notFound } from "../lib/http";
import { isAdmin } from "../middleware/auth";
import {
  AuthUser,
  Booking,
  BookingInput,
  BookingStatus,
  UserSummary,
} from "../types";
import {
  calculateTotalPrice,
  countNights,
  Extra,
  EXTRAS,
} from "../lib/pricing";
import { toRoom } from "./rooms";

export const bookingInclude = {
  user: { select: { id: true, username: true, email: true } },
  room: true,
} as const;

type DbBookingWithRelations = DbBooking & { user: UserSummary; room: DbRoom };

const parseExtras = (extras: string): Extra[] => {
  try {
    const parsed = JSON.parse(extras);
    return Array.isArray(parsed)
      ? parsed.filter((extra): extra is Extra => EXTRAS.includes(extra))
      : [];
  } catch {
    return [];
  }
};

export const toBooking = (booking: DbBookingWithRelations): Booking => {
  const extras = parseExtras(booking.extras);
  const nights = countNights(booking.checkIn, booking.checkOut);
  return {
    ...booking,
    status: booking.status as BookingStatus,
    extras,
    nights,
    totalPrice: calculateTotalPrice({
      pricePerNight: booking.room.price,
      nights,
      guests: booking.adults + booking.children,
      extras,
    }),
    room: toRoom(booking.room),
  };
};

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
];

const startOfTodayUtc = () => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
};

class BookingsService {
  async getAll(): Promise<Booking[]> {
    const bookings = await prisma.booking.findMany({
      include: bookingInclude,
      orderBy: { checkIn: "asc" },
    });
    return bookings.map(toBooking);
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: bookingInclude,
      orderBy: { checkIn: "asc" },
    });
    return bookings.map(toBooking);
  }

  async getById(id: string, requester: AuthUser): Promise<Booking> {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    if (!booking) throw notFound("Booking not found");
    if (booking.userId !== requester.userId && !isAdmin(requester))
      throw forbidden();
    return toBooking(booking);
  }

  async create(input: BookingInput, userId: string): Promise<Booking> {
    const { adults = 1, children = 0, extras = [] } = input;
    if (input.checkOut <= input.checkIn) {
      throw badRequest({ checkOut: "checkOut must be after checkIn" });
    }
    if (input.checkIn < startOfTodayUtc()) {
      throw badRequest({ checkIn: "checkIn cannot be in the past" });
    }

    const booking = await prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({ where: { id: input.roomId } });
      if (!room) throw notFound("Room not found");
      if (room.status === "MAINTENANCE") throw conflict("Room not available");
      if (adults + children > room.capacity) {
        throw badRequest({
          guests: `This room fits at most ${room.capacity} guests`,
        });
      }

      const overlapping = await tx.booking.count({
        where: {
          roomId: input.roomId,
          status: { in: ACTIVE_BOOKING_STATUSES },
          checkIn: { lt: input.checkOut },
          checkOut: { gt: input.checkIn },
        },
      });
      if (overlapping > 0) throw conflict("Room not available");

      return tx.booking.create({
        data: {
          roomId: input.roomId,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          adults,
          children,
          extras: JSON.stringify([...new Set(extras)]),
          userId,
          status: "PENDING",
        },
        include: bookingInclude,
      });
    });
    return toBooking(booking);
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) throw notFound("Booking not found");
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: bookingInclude,
    });
    return toBooking(booking);
  }

  async cancel(id: string, requester: AuthUser): Promise<Booking> {
    const booking = await this.getById(id, requester);
    if (booking.status === "CANCELLED") return booking;
    return this.updateStatus(id, "CANCELLED");
  }
}

export const bookingsService = new BookingsService();
