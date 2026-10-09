import type { Room } from "../api/types";

/** The uploaded photo first (if any), then three placeholder photos for the room type. */
export function roomPhotos(room: Pick<Room, "type" | "imageUrl">): string[] {
  const type = room.type.toLowerCase();
  const placeholders = [1, 2, 3].map((index) => `/rooms/${type}-${index}.svg`);
  return room.imageUrl ? [room.imageUrl, ...placeholders] : placeholders;
}
