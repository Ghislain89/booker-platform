import { Prisma, Room as DbRoom } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { conflict, notFound } from "../lib/http";
import {
  PageMeta,
  PublicRoom,
  Room,
  RoomInput,
  RoomQuery,
  RoomStatus,
  RoomType,
} from "../types";

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"];

const ORDER_BY: Record<
  NonNullable<RoomQuery["sort"]>,
  Prisma.RoomOrderByWithRelationInput[]
> = {
  number: [{ number: "asc" }],
  price: [{ price: "asc" }, { number: "asc" }],
  "-price": [{ price: "desc" }, { number: "asc" }],
  capacity: [{ capacity: "asc" }, { number: "asc" }],
  "-capacity": [{ capacity: "desc" }, { number: "asc" }],
};

const shuffle = <T>(items: T[]) => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};

const parseAmenities = (amenities: string): string[] => {
  try {
    const parsed = JSON.parse(amenities);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Older databases stored amenities as "WiFi, TV".
    return amenities
      ? amenities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  }
};

export const toRoom = (room: DbRoom): Room => ({
  ...room,
  type: room.type as RoomType,
  status: room.status as RoomStatus,
  amenities: parseAmenities(room.amenities),
});

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

class RoomsService {
  async getAll(options: { shuffle?: boolean } = {}): Promise<Room[]> {
    const rooms = (
      await prisma.room.findMany({ orderBy: { number: "asc" } })
    ).map(toRoom);
    if (options.shuffle) rooms.sort(() => Math.random() - 0.5);
    return rooms;
  }

  /** Public room search with filters, sorting and pagination. */
  async search(
    query: RoomQuery,
    options: { shuffle?: boolean } = {},
  ): Promise<{ data: Room[]; meta: PageMeta }> {
    const where: Prisma.RoomWhereInput = {
      type: query.types?.length ? { in: query.types } : undefined,
      featured: query.featured,
      price: { gte: query.minPrice, lte: query.maxPrice },
      capacity:
        query.capacity !== undefined ? { gte: query.capacity } : undefined,
    };
    if (query.checkIn && query.checkOut) {
      where.status = { not: "MAINTENANCE" };
      where.bookings = {
        none: {
          status: { in: ACTIVE_STATUSES },
          checkIn: { lt: query.checkOut },
          checkOut: { gt: query.checkIn },
        },
      };
    }
    const [total, rooms] = await prisma.$transaction([
      prisma.room.count({ where }),
      prisma.room.findMany({
        where,
        orderBy: ORDER_BY[query.sort ?? "number"],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    const data = rooms.map(toRoom);
    return {
      data: options.shuffle ? shuffle(data) : data,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  /** Public room detail, by id or room number, including the periods it is booked. */
  async getPublic(idOrNumber: string): Promise<PublicRoom> {
    const room = await prisma.room.findFirst({
      where: { OR: [{ id: idOrNumber }, { number: idOrNumber }] },
      include: {
        bookings: {
          where: {
            status: { in: ACTIVE_STATUSES },
            checkOut: { gt: new Date() },
          },
          select: { checkIn: true, checkOut: true },
          orderBy: { checkIn: "asc" },
        },
      },
    });
    if (!room) throw notFound("Room not found");
    const { bookings, ...rest } = room;
    return { ...toRoom(rest), bookedPeriods: bookings };
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
      if (isUniqueViolation(error))
        throw conflict("Room number already exists");
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
          amenities: room.amenities
            ? JSON.stringify(room.amenities)
            : undefined,
        },
      });
      return toRoom(updated);
    } catch (error) {
      if (isUniqueViolation(error))
        throw conflict("Room number already exists");
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
