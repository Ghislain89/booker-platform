import { Branding } from '../types';
import { brandingService } from '../services/branding';

class BrandingController {
  async get(): Promise<Branding> {
    return brandingService.get();
  }

  async update(branding: Partial<Branding>): Promise<Branding> {
    return brandingService.update(branding);
  }
}

export const brandingController = new BrandingController(); 