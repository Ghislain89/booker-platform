import express, { Request } from "express";
import { asyncHandler, badRequest, FieldErrors } from "../lib/http";
import { hasFlag, sleep } from "../lib/flags";
import { roomsService } from "../services/rooms";
import { brandingService } from "../services/branding";
import {
  ROOM_SORTS,
  ROOM_TYPES,
  RoomQuery,
  RoomSort,
  RoomType,
} from "../types";

// Read-only endpoints for guests: no token needed. The web UI uses these.
const router = express.Router();

const MAX_PAGE_SIZE = 50;

const values = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value])
    .filter((item): item is string => typeof item === "string")
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);

const parseRoomQuery = (query: Request["query"]): RoomQuery => {
  const errors: FieldErrors = {};
  const single = (name: string) => values(query[name])[0];

  const number = (
    name: string,
    opts: { min?: number; max?: number; integer?: boolean } = {},
  ) => {
    const raw = single(name);
    if (raw === undefined) return undefined;
    const value = Number(raw);
    if (!Number.isFinite(value) || (opts.integer && !Number.isInteger(value))) {
      errors[name] =
        `${name} must be ${opts.integer ? "an integer" : "a number"}`;
      return undefined;
    }
    if (opts.min !== undefined && value < opts.min)
      errors[name] = `${name} must be at least ${opts.min}`;
    if (opts.max !== undefined && value > opts.max)
      errors[name] = `${name} must be at most ${opts.max}`;
    return value;
  };

  const date = (name: string) => {
    const raw = single(name);
    if (raw === undefined) return undefined;
    const value = new Date(raw);
    if (Number.isNaN(value.getTime())) {
      errors[name] = `${name} must be an ISO 8601 date`;
      return undefined;
    }
    return value;
  };

  const types = values(query.type).map((type) => type.toUpperCase());
  const invalidType = types.find(
    (type) => !(ROOM_TYPES as readonly string[]).includes(type),
  );
  if (invalidType) errors.type = `type must be one of ${ROOM_TYPES.join(", ")}`;

  const sort = single("sort");
  if (sort !== undefined && !(ROOM_SORTS as readonly string[]).includes(sort)) {
    errors.sort = `sort must be one of ${ROOM_SORTS.join(", ")}`;
  }

  const featured = single("featured");
  if (featured !== undefined && !["true", "false"].includes(featured)) {
    errors.featured = "featured must be true or false";
  }

  const result: RoomQuery = {
    types: types as RoomType[],
    featured: featured === undefined ? undefined : featured === "true",
    minPrice: number("minPrice", { min: 0 }),
    maxPrice: number("maxPrice", { min: 0 }),
    capacity: number("capacity", { min: 1, integer: true }),
    checkIn: date("checkIn"),
    checkOut: date("checkOut"),
    sort: sort as RoomSort | undefined,
    page: number("page", { min: 1, integer: true }) ?? 1,
    pageSize:
      number("pageSize", { min: 1, max: MAX_PAGE_SIZE, integer: true }) ?? 6,
  };

  if (!!result.checkIn !== !!result.checkOut) {
    errors[result.checkIn ? "checkOut" : "checkIn"] =
      "checkIn and checkOut must be used together";
  } else if (
    result.checkIn &&
    result.checkOut &&
    result.checkOut <= result.checkIn
  ) {
    errors.checkOut = "checkOut must be after checkIn";
  }
  if (Object.keys(errors).length > 0) throw badRequest(errors);
  return result;
};

router.get(
  "/rooms",
  asyncHandler(async (req, res) => {
    const query = parseRoomQuery(req.query);
    if (hasFlag(req, "slow-rooms")) await sleep(1000 + Math.random() * 2000);
    const { data, meta } = await roomsService.search(query, {
      shuffle: hasFlag(req, "random-order"),
    });
    res.json({ success: true, data, meta });
  }),
);

router.get(
  "/rooms/:id",
  asyncHandler(async (req, res) => {
    const room = await roomsService.getPublic(req.params.id);
    res.json({ success: true, data: room });
  }),
);

router.get(
  "/branding",
  asyncHandler(async (req, res) => {
    const { name, logoUrl, description, contact, map, theme } =
      await brandingService.get();
    res.json({
      success: true,
      data: { name, logoUrl, description, contact, map, theme },
    });
  }),
);

export default router;
