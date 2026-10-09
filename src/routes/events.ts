import express from "express";
import { verifyToken } from "../middleware/auth";
import { subscribe } from "../lib/events";

// Server-Sent Events. EventSource cannot send headers, so the token may also be passed as ?token=.
const router = express.Router();

router.get("/", (req, res) => {
  const header = req.header("authorization")?.split(" ")[1];
  const token = header ?? (typeof req.query.token === "string" ? req.query.token : undefined);
  if (!token) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }
  try {
    subscribe(res, verifyToken(token));
  } catch {
    res.status(403).json({ success: false, error: "Invalid token" });
  }
});

export default router;
