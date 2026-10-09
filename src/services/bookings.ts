import { Booking } from "@prisma/client";
import { prisma } from "../lib/prisma";

class BookingsService {
  async getAll(): Promise<Booking[]> {
    return prisma.booking.findMany({
      include: {
        user: true,
        room: true,
      },
    });
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return prisma.booking.findMany({
      where: { userId },
      include: {
        user: true,
        room: true,
      },
    });
  }

  async getById(id: string): Promise<Booking | null> {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        room: true,
      },
    });
  }

  async create(
    booking: Omit<Booking, "id" | "createdAt" | "updatedAt">,
  ): Promise<Booking> {
    return prisma.booking.create({
      data: {
        ...booking,
        status: "PENDING",
      },
      include: {
        user: true,
        room: true,
      },
    });
  }

  async updateStatus(
    id: string,
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED",
  ): Promise<Booking | null> {
    return prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        room: true,
      },
    });
  }

  async cancelBooking(id: string, userId: string): Promise<Booking | null> {
    console.log("Service: Attempting to cancel booking:", { id, userId });

    const booking = await this.getById(id);
    console.log("Service: Found booking:", booking);

    if (!booking || booking.userId !== userId) {
      console.log(
        "Service: Cannot cancel booking - not found or unauthorized:",
        {
          bookingFound: !!booking,
          bookingUserId: booking?.userId,
          requestUserId: userId,
        },
      );
      return null;
    }

    const result = await this.updateStatus(id, "CANCELLED");
    console.log("Service: Booking cancelled:", result);
    return result;
  }
}

export const bookingsService = new BookingsService();
