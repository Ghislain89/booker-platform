// Assignment 5, option "Tabs and shadow DOM".
import { test, expect } from "../../support/fixtures/ui.fixture";
import { DECLINED_CARD, VALID_CARD } from "../../support/pages/BookingWizard";

test.describe("booking wizard, last step", () => {
  test.beforeEach(async ({ seed, bookingWizard }, testInfo) => {
    const { rooms } = await seed({
      rooms: [{ number: "701", type: "DELUXE", price: 150, capacity: 2 }],
    });
    testInfo.annotations.push({ type: "room", description: rooms[0].number });
    await bookingWizard.goto(rooms[0].number);
    await bookingWizard.fillDatesAndGuests({
      checkIn: "2032-03-01",
      checkOut: "2032-03-03",
    });
    await bookingWizard.chooseExtras();
  });

  test("terms open in a new tab", async ({ page, bookingWizard }) => {
    const popupPromise = page.waitForEvent("popup");
    await bookingWizard.termsLink.click();
    const terms = await popupPromise;

    await expect(
      terms.getByRole("heading", { name: "Terms and conditions" }),
    ).toBeVisible();
    await terms.close();

    // The wizard keeps its state in the first tab.
    await expect(bookingWizard.stepHeading).toContainText("Step 3 of 3");
    await bookingWizard.confirmBooking();
    await expect(page).toHaveURL(/\/my\/bookings$/);
  });

  test("payment form inside a shadow root", async ({ page, bookingWizard }) => {
    // Locators pierce open shadow roots; XPath doesn't.
    await expect(bookingWizard.payment).toBeVisible();
    const hasShadowRoot = await page
      .locator("booker-payment")
      .evaluate((element) => element.shadowRoot !== null);
    expect(hasShadowRoot).toBe(true);

    await bookingWizard.acceptTerms.check();
    await bookingWizard.pay({ ...VALID_CARD, number: "4242424242424241" });
    // The widget formats the number while you type.
    await expect(bookingWizard.payment.getByLabel("Card number")).toHaveValue(
      "4242 4242 4242 4241",
    );
    await bookingWizard.confirm.click();

    await expect(bookingWizard.error).toHaveText("Check your payment details");
    const cardNumber = bookingWizard.payment.getByLabel("Card number");
    await expect(cardNumber).toHaveAttribute("aria-invalid", "true");
    await expect(cardNumber).toHaveAccessibleDescription(
      "This card number is not valid",
    );
    await expect(cardNumber).toBeFocused();
  });

  test("declined card", async ({ page, bookingWizard }) => {
    await bookingWizard.confirmBooking({ ...VALID_CARD, number: DECLINED_CARD });

    await expect(bookingWizard.error).toHaveText(
      "Payment declined. Please use another card.",
    );
    await expect(page).toHaveURL(/\/book\//);

    await bookingWizard.pay(VALID_CARD);
    await bookingWizard.confirm.click();
    await expect(page).toHaveURL(/\/my\/bookings$/);
  });
});
