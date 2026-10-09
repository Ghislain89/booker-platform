import { Room, RoomInput } from "../types";
import { roomsService } from "../services/rooms";

class RoomsController {
  getAll(options?: { shuffle?: boolean }): Promise<Room[]> {
    return roomsService.getAll(options);
  }

  getById(id: string): Promise<Room> {
    return roomsService.getById(id);
  }

  create(room: RoomInput): Promise<Room> {
    return roomsService.create(room);
  }

  update(id: string, room: Partial<RoomInput>): Promise<Room> {
    return roomsService.update(id, room);
  }

  delete(id: string): Promise<void> {
    return roomsService.delete(id);
  }
}

export const roomsController = new RoomsController();
