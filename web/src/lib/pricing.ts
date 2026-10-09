import type { Extra } from "../api/types";

// Mirrors src/lib/pricing.ts. The server's totalPrice is leading; this is for the summary.
export const EXTRA_PRICES: Record<
  Extra,
  { amount: number; per: "guest-night" | "night" | "stay"; description: string }
> = {
  BREAKFAST: {
    amount: 15,
    per: "guest-night",
    description: "€ 15 per guest per night",
  },
  PARKING: { amount: 12, per: "night", description: "€ 12 per night" },
  LATE_CHECKOUT: {
    amount: 25,
    per: "stay",
    description: "€ 25 per stay, check out at 14:00",
  },
};

export const EXTRAS = Object.keys(EXTRA_PRICES) as Extra[];

const DAY = 24 * 60 * 60 * 1000;

export const countNights = (checkIn: string, checkOut: string) =>
  Math.max(
    0,
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / DAY,
    ),
  );

export const extraPrice = (extra: Extra, nights: number, guests: number) => {
  const { amount, per } = EXTRA_PRICES[extra];
  if (per === "guest-night") return amount * guests * nights;
  if (per === "night") return amount * nights;
  return amount;
};

export const totalPrice = (
  pricePerNight: number,
  nights: number,
  guests: number,
  extras: Extra[],
) =>
  Math.round(
    (pricePerNight * nights +
      extras.reduce(
        (sum, extra) => sum + extraPrice(extra, nights, guests),
        0,
      )) *
      100,
  ) / 100;
