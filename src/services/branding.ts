import { Branding } from '@prisma/client';
import { prisma } from '../lib/prisma';

const defaultBranding = {
  name: 'Restful Booker',
  logoUrl: 'https://example.com/logo.png',
  description: 'Your trusted hotel booking platform',
  contact: {
    name: 'Restful Booker Support',
    address: '123 Hotel Street, City, Country',
    phone: '+1 234 567 8900',
    email: 'support@restfulbooker.com'
  },
  map: {
    latitude: 40.7128,
    longitude: -74.0060
  },
  theme: {
    primaryColor: '#4A90E2',
    secondaryColor: '#F5A623'
  }
};

class BrandingService {
  async get(): Promise<Branding> {
    let branding = await prisma.branding.findFirst();
    if (!branding) {
      branding = await prisma.branding.create({
        data: {
          ...defaultBranding,
          contact: JSON.stringify(defaultBranding.contact),
          map: JSON.stringify(defaultBranding.map),
          theme: JSON.stringify(defaultBranding.theme)
        }
      });
    }
    return {
      ...branding,
      contact: JSON.parse(branding.contact),
      map: JSON.parse(branding.map),
      theme: JSON.parse(branding.theme)
    };
  }

  async update(updatedBranding: Partial<Branding>): Promise<Branding> {
    const currentBranding = await this.get();
    const updatedData = {
      ...currentBranding,
      ...updatedBranding,
      contact: typeof updatedBranding.contact === 'object' 
        ? JSON.stringify(updatedBranding.contact)
        : currentBranding.contact,
      map: typeof updatedBranding.map === 'object'
        ? JSON.stringify(updatedBranding.map)
        : currentBranding.map,
      theme: typeof updatedBranding.theme === 'object'
        ? JSON.stringify(updatedBranding.theme)
        : currentBranding.theme
    };

    const branding = await prisma.branding.update({
      where: { id: currentBranding.id },
      data: updatedData
    });

    return {
      ...branding,
      contact: JSON.parse(branding.contact),
      map: JSON.parse(branding.map),
      theme: JSON.parse(branding.theme)
    };
  }
}

export const brandingService = new BrandingService(); 