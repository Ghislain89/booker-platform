import { test as base, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { BookingWizard } from "../pages/BookingWizard";
import { LoginPage } from "../pages/LoginPage";
import { MyBookingsPage } from "../pages/MyBookingsPage";
import { RegisterPage } from "../pages/RegisterPage";
import { apiLogin, SEEDED_ADMIN, SEEDED_USER } from "../auth";

type SeedRoom = {
  number: string;
  type: "STANDARD" | "DELUXE" | "SUITE";
  price: number;
  capacity: number;
  amenities?: string[];
  status?: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
};

type SeedBooking = {
  user: string;
  room: string;
  checkIn: string;
  checkOut: string;
  status?: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
};

type SeedInput = {
  users?: { username: string; password?: string; role?: "USER" | "ADMIN" }[];
  rooms?: SeedRoom[];
  bookings?: SeedBooking[];
};

type SeedResult = {
  namespace: string;
  users: {
    token: string;
    password: string;
    user: { id: string; username: string };
  }[];
  rooms: (SeedRoom & { id: string })[];
  bookings: { id: string; status: string; totalPrice: number }[];
};

type UiFixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  bookingWizard: BookingWizard;
  myBookings: MyBookingsPage;
  userToken: string;
  adminToken: string;
  /**
   * Creates test data through the test support API. Room and user names get a
   * unique prefix, so parallel tests never share data. Everything is removed
   * after the test.
   */
  seed: (input: SeedInput) => Promise<SeedResult>;
};

export const test = base.extend<UiFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  bookingWizard: async ({ page }, use) => {
    await use(new BookingWizard(page));
  },
  myBookings: async ({ page }, use) => {
    await use(new MyBookingsPage(page));
  },
  userToken: async ({ request }, use) => {
    await use(await apiLogin(request, SEEDED_USER));
  },
  adminToken: async ({ request }, use) => {
    await use(await apiLogin(request, SEEDED_ADMIN));
  },
  seed: async ({ request }, use) => {
    const namespace = `pw_${faker.string.alphanumeric(10)}`;
    await use(async (input) => {
      const response = await request.post("/api/testing/seed", {
        data: { namespace, ...input },
      });
      await expect(response).toBeOK();
      return (await response.json()).data;
    });
    await request.delete(`/api/testing/namespace/${namespace}`);
  },
});

export { expect };
