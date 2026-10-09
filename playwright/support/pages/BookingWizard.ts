import type { Locator, Page } from "@playwright/test";

export type Extra = "Breakfast" | "Parking" | "Late check-out";

export type BookingDetails = {
  checkIn: string; // yyyy-mm-dd
  checkOut: string; // yyyy-mm-dd
  adults?: number;
  children?: number;
  extras?: Extra[];
};

export type Card = {
  name: string;
  number: string;
  expiry: string; // MM/YY
  cvc: string;
};

/** Any card that passes the Luhn check works; this one is always declined. */
export const DECLINED_CARD = "4000 0000 0000 0002";
export const VALID_CARD: Card = {
  name: "Pat Playwright",
  number: "4242 4242 4242 4242",
  expiry: "12/35",
  cvc: "123",
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
  readonly termsLink: Locator;
  readonly payment: Locator;
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
    this.termsLink = page.getByRole("link", { name: "Terms (opens in a new tab)" });
    // <booker-payment> renders its form in an open shadow root. Locators pierce
    // open shadow roots, so getByLabel works as usual.
    this.payment = page.getByRole("group", { name: "Payment details" });
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

  async pay(card: Card = VALID_CARD) {
    await this.payment.getByLabel("Cardholder name").fill(card.name);
    await this.payment.getByLabel("Card number").fill(card.number);
    await this.payment.getByLabel("Expiry date (MM/YY)").fill(card.expiry);
    await this.payment.getByLabel("CVC").fill(card.cvc);
  }

  async confirmBooking(card: Card = VALID_CARD) {
    await this.acceptTerms.check();
    await this.pay(card);
    await this.confirm.click();
  }

  /** Walks through all three steps and confirms the booking. */
  async book(details: BookingDetails) {
    await this.fillDatesAndGuests(details);
    await this.chooseExtras(details.extras);
    await this.confirmBooking();
  }
}
