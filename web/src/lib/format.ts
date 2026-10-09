import type { BookingStatus, Extra, RoomType } from "../api/types";

// Prices: "€ 240" or "€ 99.50".
export const formatPrice = (amount: number) =>
  `€ ${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;

const dateFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

// Booking dates are midnight UTC; show them in UTC so they never shift a day.
export const formatDate = (value: string | Date) =>
  dateFormat.format(new Date(value));

/** "YYYY-MM-DD" (UTC) for <input type="date">. */
export const toDateInput = (date: Date) => date.toISOString().slice(0, 10);
export const todayInput = () => toDateInput(new Date());
export const addDays = (input: string, days: number) => {
  const date = new Date(`${input}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateInput(date);
};
export const toIsoDate = (input: string) => `${input}T00:00:00.000Z`;
export const isValidDateInput = (
  value: string | null | undefined,
): value is string =>
  !!value &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(new Date(value).getTime());

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  STANDARD: "Standard",
  DELUXE: "Deluxe",
  SUITE: "Suite",
};

export const roomTypeLabel = (type: string) =>
  ROOM_TYPE_LABELS[type as RoomType] ?? type;

export const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export const EXTRA_LABELS: Record<Extra, string> = {
  BREAKFAST: "Breakfast",
  PARKING: "Parking",
  LATE_CHECKOUT: "Late check-out",
};

export const plural = (
  count: number,
  singular: string,
  pluralForm = `${singular}s`,
) => `${count} ${count === 1 ? singular : pluralForm}`;
