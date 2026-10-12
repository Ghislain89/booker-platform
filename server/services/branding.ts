import { Branding as DbBranding } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { Branding, BrandingInput } from "../types";

export const defaultBranding: Omit<Branding, "id" | "createdAt" | "updatedAt"> = {
  name: "Booker Hotel",
  logoUrl: "/logo.svg",
  description: "A small hotel by the sea, built for practising test automation.",
  contact: {
    name: "Booker Front Desk",
    address: "Testlaan 1, 3511 AB Utrecht, The Netherlands",
    phone: "+31 30 123 4567",
    email: "frontdesk@booker.test",
  },
  map: {
    latitude: 52.0907,
    longitude: 5.1214,
  },
  theme: {
    primaryColor: "#2E7D32",
    secondaryColor: "#D84315",
  },
};

const toBranding = (branding: DbBranding): Branding => ({
  ...branding,
  contact: JSON.parse(branding.contact),
  map: JSON.parse(branding.map),
  theme: JSON.parse(branding.theme),
});

const toDbData = (branding: Omit<Branding, "id" | "createdAt" | "updatedAt">) => ({
  name: branding.name,
  logoUrl: branding.logoUrl,
  description: branding.description,
  contact: JSON.stringify(branding.contact),
  map: JSON.stringify(branding.map),
  theme: JSON.stringify(branding.theme),
});

class BrandingService {
  async get(): Promise<Branding> {
    const branding =
      (await prisma.branding.findFirst()) ??
      (await prisma.branding.create({ data: toDbData(defaultBranding) }));
    return toBranding(branding);
  }

  async update(input: BrandingInput): Promise<Branding> {
    const current = await this.get();
    const merged = {
      name: input.name ?? current.name,
      logoUrl: input.logoUrl ?? current.logoUrl,
      description: input.description ?? current.description,
      contact: { ...current.contact, ...input.contact },
      map: { ...current.map, ...input.map },
      theme: { ...current.theme, ...input.theme },
    };
    const branding = await prisma.branding.update({
      where: { id: current.id },
      data: toDbData(merged),
    });
    return toBranding(branding);
  }

  async reset(): Promise<Branding> {
    const current = await this.get();
    const branding = await prisma.branding.update({
      where: { id: current.id },
      data: toDbData(defaultBranding),
    });
    return toBranding(branding);
  }
}

export const brandingService = new BrandingService();
