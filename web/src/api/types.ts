export type RoomType = "STANDARD" | "DELUXE" | "SUITE";
export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type Extra = "BREAKFAST" | "PARKING" | "LATE_CHECKOUT";
export type Role = "ROLE_USER" | "ROLE_ADMIN";

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  price: number;
  capacity: number;
  // Optional so the UI survives patched or mocked responses with fewer fields.
  amenities?: string[];
  status?: RoomStatus;
  featured?: boolean;
  /** Uploaded photo (/uploads/...), or null: the UI then shows placeholder photos per room type. */
  imageUrl?: string | null;
  /** Manual order set by drag & drop in Room management. */
  position?: number;
}

export interface PublicRoom extends Room {
  bookedPeriods: { checkIn: string; checkOut: string }[];
}

export interface RoomInput {
  number: string;
  type: RoomType;
  price: number;
  capacity: number;
  amenities: string[];
  status: RoomStatus;
  featured: boolean;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  adults: number;
  children: number;
  extras: Extra[];
  nights: number;
  totalPrice: number;
  user?: { id: string; username: string; email: string };
  room?: Room;
}

export interface Branding {
  name: string;
  logoUrl: string;
  description: string;
  contact: { name: string; address: string; phone: string; email: string };
  map: { latitude: number; longitude: number };
  theme: { primaryColor: string; secondaryColor: string };
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type MessageStatus = "UNREAD" | "READ" | "ARCHIVED";

export interface Message {
  id: string;
  userId: string | null;
  name: string | null;
  email: string | null;
  subject: string;
  content: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; username: string; email: string } | null;
}

export type ReportType = "OCCUPANCY" | "REVENUE" | "CUSTOMER_SATISFACTION";

export interface Report {
  id: string;
  type: ReportType;
  data: Record<string, unknown>;
  period: { start: string; end: string };
  generatedAt: string;
}
