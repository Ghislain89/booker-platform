import { Prisma, Room as DbRoom } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { conflict, notFound } from "../lib/http";
import { Room, RoomInput, RoomStatus, RoomType } from "../types";

const parseAmenities = (amenities: string): string[] => {
  try {
    const parsed = JSON.parse(amenities);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Older databases stored amenities as "WiFi, TV".
    return amenities ? amenities.split(",").map((item) => item.trim()).filter(Boolean) : [];
  }
};

export const toRoom = (room: DbRoom): Room => ({
  ...room,
  type: room.type as RoomType,
  status: room.status as RoomStatus,
  amenities: parseAmenities(room.amenities),
});

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

class RoomsService {
  async getAll(options: { shuffle?: boolean } = {}): Promise<Room[]> {
    const rooms = (await prisma.room.findMany({ orderBy: { number: "asc" } })).map(toRoom);
    if (options.shuffle) rooms.sort(() => Math.random() - 0.5);
    return rooms;
  }

  async getById(id: string): Promise<Room> {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) throw notFound("Room not found");
    return toRoom(room);
  }

  async create(room: RoomInput): Promise<Room> {
    try {
      const created = await prisma.room.create({
        data: { ...room, amenities: JSON.stringify(room.amenities ?? []) },
      });
      return toRoom(created);
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict("Room number already exists");
      throw error;
    }
  }

  async update(id: string, room: Partial<RoomInput>): Promise<Room> {
    await this.getById(id);
    try {
      const updated = await prisma.room.update({
        where: { id },
        data: {
          ...room,
          amenities: room.amenities ? JSON.stringify(room.amenities) : undefined,
        },
      });
      return toRoom(updated);
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict("Room number already exists");
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    const bookings = await prisma.booking.count({ where: { roomId: id } });
    if (bookings > 0) throw conflict("Room has bookings and cannot be deleted");
    await prisma.room.delete({ where: { id } });
  }
}

export const roomsService = new RoomsService();
