import type { Locator, Page } from "@playwright/test";

export class LoginPage {
  readonly heading: Locator;
  readonly username: Locator;
  readonly password: Locator;
  readonly rememberMe: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Log in" });
    this.username = page.getByLabel("Username");
    this.password = page.getByLabel("Password", { exact: true });
    this.rememberMe = page.getByLabel("Remember me");
    this.submit = page.getByRole("button", { name: "Log in" });
    this.error = page.getByRole("alert");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }
}
