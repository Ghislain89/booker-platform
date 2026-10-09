import { Room } from "../types";
import { prisma } from "../lib/prisma";

class RoomsService {
  private parseAmenities(amenities: string): string[] {
    try {
      return JSON.parse(amenities);
    } catch (error) {
      // If parsing fails, return an empty array
      console.error("Failed to parse amenities:", error);
      return [];
    }
  }

  async getAll(): Promise<Room[]> {
    const rooms = await prisma.room.findMany();
    return rooms.map((room) => ({
      ...room,
      amenities: this.parseAmenities(room.amenities),
    }));
  }

  async getById(id: string): Promise<Room | null> {
    const room = await prisma.room.findUnique({
      where: { id },
    });
    if (!room) return null;
    return {
      ...room,
      amenities: this.parseAmenities(room.amenities),
    };
  }

  async create(
    room: Omit<Room, "id" | "createdAt" | "updatedAt">,
  ): Promise<Room> {
    const createdRoom = await prisma.room.create({
      data: {
        ...room,
        amenities: JSON.stringify(room.amenities),
      },
    });
    return {
      ...createdRoom,
      amenities: this.parseAmenities(createdRoom.amenities),
    };
  }

  async update(id: string, room: Partial<Room>): Promise<Room | null> {
    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        ...room,
        amenities: room.amenities ? JSON.stringify(room.amenities) : undefined,
      },
    });
    return {
      ...updatedRoom,
      amenities: this.parseAmenities(updatedRoom.amenities),
    };
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.room.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const roomsService = new RoomsService();
