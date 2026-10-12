import { Branding, BrandingInput } from "../types";
import { brandingService } from "../services/branding";

class BrandingController {
  get(): Promise<Branding> {
    return brandingService.get();
  }

  update(branding: BrandingInput): Promise<Branding> {
    return brandingService.update(branding);
  }

  reset(): Promise<Branding> {
    return brandingService.reset();
  }
}

export const brandingController = new BrandingController();
