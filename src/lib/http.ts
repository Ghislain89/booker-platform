import { NextFunction, Request, RequestHandler, Response } from "express";

export type FieldErrors = Record<string, string>;

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: FieldErrors,
  ) {
    super(message);
  }
}

export const badRequest = (details: FieldErrors) =>
  new HttpError(400, "Validation failed", details);
export const forbidden = (message = "Access denied") => new HttpError(403, message);
export const notFound = (message: string) => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);

// Express 4 does not catch rejected promises; forward them to the error handler.
export const asyncHandler =
  <R extends Request = Request>(
    fn: (req: R, res: Response, next: NextFunction) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    fn(req as R, res, next).catch(next);
  };
