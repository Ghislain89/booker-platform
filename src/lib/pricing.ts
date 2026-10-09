// Booking prices are computed on the server. The web UI shows the same numbers
// in its summary (web/src/lib/pricing.ts mirrors these rules).

export const EXTRAS = ["BREAKFAST", "PARKING", "LATE_CHECKOUT"] as const;
export type Extra = (typeof EXTRAS)[number];

export const EXTRA_PRICES: Record<
  Extra,
  { amount: number; per: "guest-night" | "night" | "stay" }
> = {
  BREAKFAST: { amount: 15, per: "guest-night" },
  PARKING: { amount: 12, per: "night" },
  LATE_CHECKOUT: { amount: 25, per: "stay" },
};

const DAY = 24 * 60 * 60 * 1000;

export const countNights = (checkIn: Date, checkOut: Date) =>
  Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / DAY));

export const calculateTotalPrice = (input: {
  pricePerNight: number;
  nights: number;
  guests: number;
  extras: readonly Extra[];
}) => {
  const { pricePerNight, nights, guests, extras } = input;
  const extrasTotal = extras.reduce((sum, extra) => {
    const { amount, per } = EXTRA_PRICES[extra];
    if (per === "guest-night") return sum + amount * guests * nights;
    if (per === "night") return sum + amount * nights;
    return sum + amount;
  }, 0);
  return Math.round((pricePerNight * nights + extrasTotal) * 100) / 100;
};
