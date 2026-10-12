import express from "express";
import { reportsController } from "../controllers/reports";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import { asyncHandler } from "../lib/http";
import { asBody, Validator } from "../lib/validation";
import { REPORT_TYPES } from "../types";

const router = express.Router();

router.get("/", authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
  const reports = await reportsController.getAll();
  res.json({ success: true, data: reports });
}));

router.get("/:id", authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
  const report = await reportsController.getById(req.params.id);
  res.json({ success: true, data: report });
}));

router.post("/generate", authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
  const v = new Validator(asBody(req.body));
  const type = v.oneOf("type", REPORT_TYPES);
  const period = new Validator(asBody(v.object("period", { required: true })));
  const start = period.date("start");
  const end = period.date("end");
  for (const [field, message] of Object.entries(period.errors)) v.error(`period.${field}`, message);
  if (start && end && end < start) v.error("period.end", "period.end must be after period.start");
  v.assertValid();

  const report = await reportsController.generateReport(type!, {
    start: start!.toISOString(),
    end: end!.toISOString(),
  });
  res.status(201).json({ success: true, data: report });
}));

router.delete("/:id", authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
  await reportsController.delete(req.params.id);
  res.json({ success: true, message: "Report deleted successfully" });
}));

export default router;
