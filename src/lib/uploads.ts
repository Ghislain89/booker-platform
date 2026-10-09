import fs from "fs";
import path from "path";
import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { badRequest } from "./http";

// Image uploads (room photos, avatars): stored in uploads/ and served at /uploads.

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? path.join(__dirname, "..", "..", "uploads"));
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, callback) =>
      callback(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${EXTENSIONS[file.mimetype]}`),
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (req, file, callback) => {
    if (EXTENSIONS[file.mimetype]) return callback(null, true);
    callback(badRequest({ [file.fieldname]: "Only PNG, JPEG, GIF or WebP images are allowed" }));
  },
});

/** Accepts a single image in `field`; turns multer errors into 400 responses. */
export const singleImage = (field: string) => (req: Request, res: Response, next: NextFunction) =>
  upload.single(field)(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      return next(
        badRequest({
          [field]:
            error.code === "LIMIT_FILE_SIZE"
              ? "The image must be 2 MB or smaller"
              : error.code === "LIMIT_UNEXPECTED_FILE"
                ? `Send the image in the '${field}' field`
                : error.message,
        }),
      );
    }
    if (error) return next(error);
    if (!req.file) return next(badRequest({ [field]: `${field} is required` }));
    next();
  });

export const publicUrl = (file: Express.Multer.File) => `/uploads/${file.filename}`;

/** Removes a previously uploaded file; ignores URLs outside /uploads. */
export function removeUpload(url: string | null | undefined) {
  if (!url?.startsWith("/uploads/")) return;
  fs.rm(path.join(UPLOAD_DIR, path.basename(url)), { force: true }, () => {});
}

export function clearUploads() {
  for (const name of fs.readdirSync(UPLOAD_DIR)) {
    if (!name.startsWith(".")) fs.rmSync(path.join(UPLOAD_DIR, name), { force: true });
  }
}
