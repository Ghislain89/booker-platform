import type { Locator, Page } from "@playwright/test";

// Assignment 2: a page object for /login. Add the locators and actions your tests need,
// then register it as a fixture in ../fixtures/ui.fixture.ts.
export class LoginPage {
  readonly username: Locator;

  constructor(readonly page: Page) {
    this.username = page.getByLabel("Username");
    // TODO: the password field and the "Log in" button
  }

  async goto() {
    await this.page.goto("/login");
  }

  // TODO: async login(username: string, password: string) { ... }
}
