import AxeBuilder from "@axe-core/playwright";
import type { Page, TestInfo } from "@playwright/test";
import { test, expect } from "../../support/fixtures/ui.fixture";

async function expectNoViolations(
  page: Page,
  testInfo: TestInfo,
  name: string,
) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  await testInfo.attach(`axe: ${name}`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: "application/json",
  });
  expect(results.violations, `accessibility violations on "${name}"`).toEqual(
    [],
  );
}

test("Assignment 7: every step of the booking wizard is accessible", async ({
  page,
  bookingWizard,
}, testInfo) => {
  await bookingWizard.goto("101");

  await expect(bookingWizard.stepHeading).toHaveText(
    "Step 1 of 3: Dates & guests",
  );
  await expectNoViolations(page, testInfo, "step 1");

  await bookingWizard.fillDatesAndGuests({
    checkIn: "2031-08-01",
    checkOut: "2031-08-03",
  });
  await expect(bookingWizard.stepHeading).toHaveText("Step 2 of 3: Extras");
  await expectNoViolations(page, testInfo, "step 2");

  await bookingWizard.chooseExtras(["Breakfast"]);
  await expect(bookingWizard.stepHeading).toHaveText("Step 3 of 3: Review");
  await expectNoViolations(page, testInfo, "step 3");
});

test("Assignment 7 bonus: aria snapshots of the navigation and the booking summary", async ({
  page,
  bookingWizard,
}) => {
  await bookingWizard.goto("101");

  await expect(page.getByRole("navigation", { name: "Main" }))
    .toMatchAriaSnapshot(`
    - navigation "Main":
      - list:
        - listitem:
          - link "Rooms"
        - listitem:
          - link "My bookings"
      - text: Signed in as
      - strong: user
      - button "Log out"
  `);

  await bookingWizard.fillDatesAndGuests({
    checkIn: "2031-08-01",
    checkOut: "2031-08-03",
    adults: 2,
  });
  await bookingWizard.chooseExtras(["Breakfast"]);

  await expect(bookingWizard.summary).toMatchAriaSnapshot(`
    - region "Booking summary":
      - term: Room
      - definition: Room 101 (Standard)
      - term: Check-in
      - definition: August 1, 2031
      - term: Check-out
      - definition: August 3, 2031
      - term: Guests
      - definition: 2 adults, 0 children
      - term: Room price
      - definition: 2 nights × € 95 = € 190
      - term: Extras
      - definition: Breakfast (€ 60)
      - term: Total
      - definition:
        - strong: € 250
  `);
});
