import type { Locator, Page } from "@playwright/test";

export type BookingTab = "Upcoming" | "Past" | "Cancelled";

export class MyBookingsPage {
  readonly heading: Locator;
  readonly rows: Locator;
  readonly emptyState: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "My bookings" });
    this.rows = page.getByTestId("booking-row");
    this.emptyState = page.getByText("No bookings yet");
  }

  async goto() {
    await this.page.goto("/my/bookings");
  }

  async openTab(tab: BookingTab) {
    await this.page.getByRole("tab", { name: tab }).click();
  }

  /** The row of a booking, found by room number. "Room 101 (" doesn't match room 1010. */
  rowFor(roomNumber: string) {
    return this.rows.filter({ hasText: `Room ${roomNumber} (` });
  }

  async cancel(roomNumber: string) {
    this.page.once("dialog", (dialog) => dialog.accept());
    await this.rowFor(roomNumber)
      .getByRole("button", { name: "Cancel booking" })
      .click();
  }
}
