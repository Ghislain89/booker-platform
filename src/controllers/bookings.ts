import { Booking } from '../types';
import { bookingsService } from '../services/bookings';

class BookingsController {
  async getAll(): Promise<Booking[]> {
    return bookingsService.getAll();
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return bookingsService.getUserBookings(userId);
  }

  async getById(id: string): Promise<Booking | null> {
    return bookingsService.getById(id);
  }

  async create(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    return bookingsService.create(booking);
  }

  async updateStatus(id: string, status: Booking['status']): Promise<Booking | null> {
    return bookingsService.updateStatus(id, status);
  }

  async cancelBooking(id: string, userId: string): Promise<Booking | null> {
    return bookingsService.cancelBooking(id, userId);
  }
}

export const bookingsController = new BookingsController(); 