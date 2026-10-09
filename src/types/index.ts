import type { Extra } from "../lib/pricing";

// API types. Prisma (SQLite) stores enums and nested objects as strings;
// the services convert database rows into these shapes.

export const ROOM_TYPES = ["STANDARD", "DELUXE", "SUITE"] as const;
export const ROOM_STATUSES = ["AVAILABLE", "OCCUPIED", "MAINTENANCE"] as const;
export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;
export const MESSAGE_STATUSES = ["UNREAD", "READ", "ARCHIVED"] as const;
export const REPORT_TYPES = ["OCCUPANCY", "REVENUE", "CUSTOMER_SATISFACTION"] as const;

export type RoomType = (typeof ROOM_TYPES)[number];
export type RoomStatus = (typeof ROOM_STATUSES)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];
export type ReportType = (typeof REPORT_TYPES)[number];
export type Role = "ROLE_USER" | "ROLE_ADMIN";

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  /** Uploaded with POST /api/auth/me/avatar. */
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** User as embedded in bookings and messages (never includes the password hash). */
export interface UserSummary {
  id: string;
  username: string;
  email: string;
}

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  price: number;
  capacity: number;
  amenities: string[];
  status: RoomStatus;
  /** Shown on the home page. */
  featured: boolean;
  /** Uploaded with POST /api/rooms/{id}/image. */
  imageUrl: string | null;
  /** Order in the admin room list; changed with PUT /api/rooms/order. */
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export type RoomInput = Pick<Room, "number" | "type" | "price" | "capacity" | "amenities"> & {
  status?: RoomStatus;
  featured?: boolean;
};

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  status: BookingStatus;
  adults: number;
  children: number;
  extras: Extra[];
  /** Computed: number of nights between check-in and check-out. */
  nights: number;
  /** Computed: nights × room price + extras. */
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  user?: UserSummary;
  room?: Room;
}

export interface BookingInput {
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  adults?: number;
  children?: number;
  extras?: Extra[];
}

export interface PublicRoom extends Room {
  /** Active (pending or confirmed) bookings that have not ended yet. */
  bookedPeriods: { checkIn: Date; checkOut: Date }[];
}

export const ROOM_SORTS = ["number", "price", "-price", "capacity", "-capacity"] as const;
export type RoomSort = (typeof ROOM_SORTS)[number];

export interface RoomQuery {
  types?: RoomType[];
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  capacity?: number;
  checkIn?: Date;
  checkOut?: Date;
  sort?: RoomSort;
  page: number;
  pageSize: number;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Message {
  id: string;
  /** Null for messages sent with the public contact form. */
  userId: string | null;
  /** Contact form only. */
  name: string | null;
  /** Contact form only. */
  email: string | null;
  subject: string;
  content: string;
  status: MessageStatus;
  createdAt: Date;
  updatedAt: Date;
  user?: UserSummary | null;
}

export interface Report {
  id: string;
  type: ReportType;
  data: Record<string, unknown>;
  period: { start: string; end: string };
  generatedAt: Date;
}

export interface Branding {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  contact: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  map: {
    latitude: number;
    longitude: number;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type BrandingInput = Partial<Omit<Branding, "id" | "createdAt" | "updatedAt">>;

export interface AuthUser {
  userId: string;
  username: string;
  role: Role;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
