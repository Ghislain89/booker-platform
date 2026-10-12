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

  setImage(id: string, imageUrl: string | null): Promise<Room> {
    return roomsService.setImage(id, imageUrl);
  }

  reorder(roomIds: string[]): Promise<Room[]> {
    return roomsService.reorder(roomIds);
  }
}

export const roomsController = new RoomsController();
