import { NextFunction, Request, Response } from "express";
import { TEST_API_ENABLED } from "../config/env";

// Trainer flags (bug mode & chaos mode). See docs/frontend-spec.md §7.
export const FLAGS = [
  "slow-rooms",
  "flaky-booking",
  "stale-list",
  "bug-a11y",
  "bug-visual",
  "bug-price",
  "bug-auth",
  "random-order",
  "popup-cookie",
] as const;

export type Flag = (typeof FLAGS)[number];

let globalFlags = new Set<Flag>();

export const isFlag = (value: string): value is Flag => (FLAGS as readonly string[]).includes(value);

export const getGlobalFlags = (): Flag[] => [...globalFlags];

export const setGlobalFlags = (flags: Flag[]) => {
  globalFlags = new Set(flags);
};

const parseHeader = (header?: string): Flag[] =>
  (header ?? "")
    .split(",")
    .map((flag) => flag.trim())
    .filter(isFlag);

/** Combines the runtime flags with the per-request `x-booker-flags` header. */
export const flagsMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  req.flags = TEST_API_ENABLED
    ? new Set<string>([...globalFlags, ...parseHeader(req.header("x-booker-flags"))])
    : new Set<string>();
  next();
};

export const hasFlag = (req: Request, flag: Flag) => req.flags?.has(flag) ?? false;

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
