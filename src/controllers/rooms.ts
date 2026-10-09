import { Room } from '../types';
import { roomsService } from '../services/rooms';

class RoomsController {
  async getAll(): Promise<Room[]> {
    return roomsService.getAll();
  }

  async getById(id: string): Promise<Room | null> {
    return roomsService.getById(id);
  }

  async create(room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<Room> {
    return roomsService.create(room);
  }

  async update(id: string, room: Partial<Room>): Promise<Room | null> {
    return roomsService.update(id, room);
  }

  async delete(id: string): Promise<boolean> {
    return roomsService.delete(id);
  }
}

export const roomsController = new RoomsController(); 