import express from "express";
import { authController } from "../controllers/auth";
import { asyncHandler } from "../lib/http";
import { authenticate } from "../middleware/auth";
import { publicUrl, singleImage } from "../lib/uploads";
import { asBody, Validator } from "../lib/validation";

const router = express.Router();

const USERNAME_PATTERN = /^[A-Za-z0-9_.-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/login", asyncHandler(async (req, res) => {
  const v = new Validator(asBody(req.body));
  const username = v.string("username");
  const password = v.string("password");
  v.assertValid();

  const response = await authController.login({ username: username!, password: password! });
  res.json({ success: true, data: response });
}));

router.post("/register", asyncHandler(async (req, res) => {
  const v = new Validator(asBody(req.body));
  const username = v.string("username", {
    min: 3,
    max: 50,
    pattern: USERNAME_PATTERN,
    patternMessage: "username may only contain letters, digits, '.', '_' and '-'",
  });
  const email = v.string("email", { max: 254, pattern: EMAIL_PATTERN, patternMessage: "email must be a valid e-mail address" });
  const password = v.string("password", { min: 8, max: 100 });
  v.assertValid();

  const response = await authController.register({ username: username!, email: email!, password: password! });
  res.status(201).json({ success: true, data: response });
}));

router.get("/me", authenticate, asyncHandler(async (req, res) => {
  const user = await authController.getProfile(req.user!.userId);
  res.json({ success: true, data: user });
}));

router.put("/me", authenticate, asyncHandler(async (req, res) => {
  const v = new Validator(asBody(req.body));
  const email = v.string("email", { max: 254, pattern: EMAIL_PATTERN, patternMessage: "email must be a valid e-mail address" });
  v.assertValid();
  const user = await authController.updateProfile(req.user!.userId, { email });
  res.json({ success: true, data: user });
}));

router.post("/me/avatar", authenticate, singleImage("avatar"), asyncHandler(async (req, res) => {
  const user = await authController.setAvatar(req.user!.userId, publicUrl(req.file!));
  res.json({ success: true, data: user });
}));

router.post("/logout", asyncHandler(async (req, res) => {
  await authController.logout();
  res.json({ success: true });
}));

export default router;
