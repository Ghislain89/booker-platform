import express from "express";
import { brandingController } from "../controllers/branding";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import { asyncHandler } from "../lib/http";
import { asBody, Validator } from "../lib/validation";
import { BrandingInput } from "../types";

const router = express.Router();

const COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const readBranding = (body: unknown): BrandingInput => {
  const v = new Validator(asBody(body));
  const input: BrandingInput = {
    name: v.string("name", { required: false, max: 100 }),
    logoUrl: v.string("logoUrl", { required: false, max: 500 }),
    description: v.string("description", { required: false, max: 1000 }),
  };

  const contact = v.object("contact");
  if (contact) {
    const c = new Validator(contact);
    input.contact = {
      name: c.string("name", { required: false, max: 100 }),
      address: c.string("address", { required: false, max: 200 }),
      phone: c.string("phone", { required: false, max: 50 }),
      email: c.string("email", { required: false, max: 254 }),
    } as BrandingInput["contact"];
    for (const [field, message] of Object.entries(c.errors)) v.error(`contact.${field}`, message);
  }

  const map = v.object("map");
  if (map) {
    const m = new Validator(map);
    input.map = {
      latitude: m.number("latitude", { required: false, min: -90, max: 90 }),
      longitude: m.number("longitude", { required: false, min: -180, max: 180 }),
    } as BrandingInput["map"];
    for (const [field, message] of Object.entries(m.errors)) v.error(`map.${field}`, message);
  }

  const theme = v.object("theme");
  if (theme) {
    const t = new Validator(theme);
    const colour = { required: false, pattern: COLOR_PATTERN, patternMessage: "must be a hex colour like #2E7D32" };
    input.theme = {
      primaryColor: t.string("primaryColor", colour),
      secondaryColor: t.string("secondaryColor", colour),
    } as BrandingInput["theme"];
    for (const [field, message] of Object.entries(t.errors)) v.error(`theme.${field}`, message);
  }

  v.assertValid();
  return JSON.parse(JSON.stringify(input));
};

router.get("/", authenticate, asyncHandler(async (req, res) => {
  const branding = await brandingController.get();
  res.json({ success: true, data: branding });
}));

router.put("/", authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
  const branding = await brandingController.update(readBranding(req.body));
  res.json({ success: true, data: branding });
}));

router.post("/reset", authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
  const branding = await brandingController.reset();
  res.json({ success: true, data: branding });
}));

export default router;
