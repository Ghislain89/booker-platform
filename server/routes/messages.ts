import express from "express";
import { messagesController } from "../controllers/messages";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import { asyncHandler } from "../lib/http";
import { asBody, Validator } from "../lib/validation";
import { MESSAGE_STATUSES } from "../types";

const router = express.Router();

router.get("/", authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
  const messages = await messagesController.getAll();
  res.json({ success: true, data: messages });
}));

router.get("/my-messages", authenticate, asyncHandler(async (req, res) => {
  const messages = await messagesController.getUserMessages(req.user!.userId);
  res.json({ success: true, data: messages });
}));

router.get("/:id", authenticate, asyncHandler(async (req, res) => {
  const message = await messagesController.getById(req.params.id, req.user!);
  res.json({ success: true, data: message });
}));

router.post("/", authenticate, asyncHandler(async (req, res) => {
  const v = new Validator(asBody(req.body));
  const subject = v.string("subject", { max: 200 });
  const content = v.string("content", { max: 5000 });
  v.assertValid();

  const message = await messagesController.create({ subject: subject!, content: content! }, req.user!.userId);
  res.status(201).json({ success: true, data: message });
}));

router.put("/:id", authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
  const v = new Validator(asBody(req.body));
  const status = v.oneOf("status", MESSAGE_STATUSES);
  v.assertValid();

  const message = await messagesController.updateStatus(req.params.id, status!);
  res.json({ success: true, data: message });
}));

router.delete("/:id", authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
  await messagesController.delete(req.params.id);
  res.json({ success: true, message: "Message deleted successfully" });
}));

export default router;
