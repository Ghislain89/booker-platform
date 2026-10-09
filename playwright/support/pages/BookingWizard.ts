import type { Locator, Page } from "@playwright/test";

export type Extra = "Breakfast" | "Parking" | "Late check-out";

export type BookingDetails = {
  checkIn: string; // yyyy-mm-dd
  checkOut: string; // yyyy-mm-dd
  adults?: number;
  children?: number;
  extras?: Extra[];
};

export class BookingWizard {
  readonly stepHeading: Locator;
  readonly checkIn: Locator;
  readonly checkOut: Locator;
  readonly adults: Locator;
  readonly children: Locator;
  readonly next: Locator;
  readonly back: Locator;
  readonly summary: Locator;
  readonly totalPrice: Locator;
  readonly acceptTerms: Locator;
  readonly confirm: Locator;
  readonly error: Locator;

  constructor(readonly page: Page) {
    this.stepHeading = page.getByRole("heading", { name: /^Step \d of 3/ });
    this.checkIn = page.getByLabel("Check-in date");
    this.checkOut = page.getByLabel("Check-out date");
    this.adults = page.getByLabel("Adults");
    this.children = page.getByLabel("Children");
    this.next = page.getByRole("button", { name: "Next" });
    this.back = page.getByRole("button", { name: "Back" });
    this.summary = page.getByRole("region", { name: "Booking summary" });
    this.totalPrice = page.getByTestId("total-price");
    this.acceptTerms = page.getByLabel("I accept the terms and conditions");
    this.confirm = page.getByRole("button", { name: "Confirm booking" });
    this.error = page.getByRole("alert");
  }

  async goto(roomNumber: string) {
    await this.page.goto(`/book/${roomNumber}`);
  }

  extra(name: Extra) {
    return this.page.getByLabel(name, { exact: true });
  }

  async fillDatesAndGuests({
    checkIn,
    checkOut,
    adults = 1,
    children = 0,
  }: BookingDetails) {
    await this.checkIn.fill(checkIn);
    await this.checkOut.fill(checkOut);
    await this.adults.fill(String(adults));
    await this.children.fill(String(children));
    await this.next.click();
  }

  async chooseExtras(extras: Extra[] = []) {
    for (const extra of extras) {
      await this.extra(extra).check();
    }
    await this.next.click();
  }

  async confirmBooking() {
    await this.acceptTerms.check();
    await this.confirm.click();
  }

  /** Walks through all three steps and confirms the booking. */
  async book(details: BookingDetails) {
    await this.fillDatesAndGuests(details);
    await this.chooseExtras(details.extras);
    await this.confirmBooking();
  }
}
