import { AuthUser, Booking, BookingInput, BookingStatus } from "../types";
import { bookingsService } from "../services/bookings";

class BookingsController {
  getAll(): Promise<Booking[]> {
    return bookingsService.getAll();
  }

  getUserBookings(userId: string): Promise<Booking[]> {
    return bookingsService.getUserBookings(userId);
  }

  getById(id: string, requester: AuthUser): Promise<Booking> {
    return bookingsService.getById(id, requester);
  }

  create(booking: BookingInput, userId: string): Promise<Booking> {
    return bookingsService.create(booking, userId);
  }

  updateStatus(id: string, status: BookingStatus, actor?: string): Promise<Booking> {
    return bookingsService.updateStatus(id, status, actor);
  }

  cancel(id: string, requester: AuthUser): Promise<Booking> {
    return bookingsService.cancel(id, requester);
  }
}

export const bookingsController = new BookingsController();
