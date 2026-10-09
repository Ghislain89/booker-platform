import { DEBUG, PORT, TEST_API_ENABLED } from "./config/env";
import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import http from "http";
import path from "path";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { HttpError } from "./lib/http";
import { flagsMiddleware } from "./lib/flags";
import authRouter from "./routes/auth";
import roomsRouter from "./routes/rooms";
import bookingsRouter from "./routes/bookings";
import messagesRouter from "./routes/messages";
import reportsRouter from "./routes/reports";
import brandingRouter from "./routes/branding";
import testingRouter from "./routes/testing";
import publicRouter from "./routes/public";

const app = express();

app.use(cors());
app.use(express.json());
app.use(flagsMiddleware);

if (DEBUG) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      console.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`,
      );
    });
    next();
  });
}

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Download Swagger JSON
app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=swagger.json");
  res.send(JSON.stringify(swaggerSpec, null, 2));
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/public", publicRouter);
app.use("/api/auth", authRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/branding", brandingRouter);
if (TEST_API_ENABLED) {
  app.use("/api/testing", testingRouter);
}

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, error: "Not found" });
});

// Error handling middleware
app.use(
  (
    err: Error & { type?: string },
    req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({
        success: false,
        error: err.message,
        ...(err.details && { details: err.details }),
      });
    }
    if (err.type === "entity.parse.failed") {
      return res
        .status(400)
        .json({ success: false, error: "Invalid JSON body" });
    }
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Something went wrong!",
    });
  },
);

const WEB_ROOT = path.join(__dirname, "..", "web");

/**
 * Serves the web UI on the same port as the API.
 * - `npm run dev`: Vite in middleware mode (on-the-fly compilation + hot reload).
 * - `npm start` (`--static`): the production build in web/dist (run `npm run build` first).
 */
async function attachWebApp(server: http.Server) {
  if (process.argv.includes("--static")) {
    const dist = path.join(WEB_ROOT, "dist");
    const index = path.join(dist, "index.html");
    if (!fs.existsSync(index)) {
      throw new Error(
        "web/dist not found: run `npm run build` before `npm start`.",
      );
    }
    app.use(express.static(dist, { index: false }));
    app.get("*", (req, res) => res.sendFile(index));
    return;
  }
  process.env.VITE_CJS_IGNORE_WARNING = "true";
  const { createServer } = await import("vite");
  const vite = await createServer({
    root: WEB_ROOT,
    configFile: path.join(WEB_ROOT, "vite.config.ts"),
    server: { middlewareMode: true, hmr: { server } },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

async function main() {
  const server = http.createServer(app);
  await attachWebApp(server);
  server.listen(PORT, () => {
    console.log(`Booker is running on http://localhost:${PORT}`);
    console.log(
      `Swagger documentation available at http://localhost:${PORT}/api-docs`,
    );
    if (TEST_API_ENABLED)
      console.log(
        `Test support API enabled at http://localhost:${PORT}/api/testing`,
      );
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export default app;
