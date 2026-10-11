import type { Locator, Page } from "@playwright/test";

// Assignment 2: a page object for /register. Add the locators and actions your tests need,
// then register it as a fixture in ../fixtures/ui.fixture.ts.
export class RegisterPage {
  readonly username: Locator;

  constructor(readonly page: Page) {
    this.username = page.getByLabel("Username");
    // TODO: e-mail, password, confirm password, the terms checkbox and the "Register" button.
    // Careful: "Password" also matches "Confirm password".
  }

  async goto() {
    await this.page.goto("/register");
  }

  // TODO: async register(user: { username: string; email: string; password: string }) { ... }
}
