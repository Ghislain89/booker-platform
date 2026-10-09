import { DEBUG, PORT, TEST_API_ENABLED } from "./config/env";
import express, { NextFunction, Request, Response } from "express";
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

const app = express();

app.use(cors());
app.use(express.json());
app.use(flagsMiddleware);

if (DEBUG) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
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
app.use((err: Error & { type?: string }, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      success: false,
      error: err.message,
      ...(err.details && { details: err.details }),
    });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, error: "Invalid JSON body" });
  }
  console.error(err);
  res.status(500).json({
    success: false,
    error: "Something went wrong!",
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
    if (TEST_API_ENABLED) console.log(`Test support API enabled at http://localhost:${PORT}/api/testing`);
  });
}

export default app;
