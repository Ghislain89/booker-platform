import type { Locator, Page } from "@playwright/test";

export type NewUser = { username: string; email: string; password: string };

export class RegisterPage {
  readonly heading: Locator;
  readonly username: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly confirmPassword: Locator;
  readonly acceptTerms: Locator;
  readonly submit: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Create an account" });
    this.username = page.getByLabel("Username");
    this.email = page.getByLabel("Email");
    // exact: "Password" would also match "Confirm password"
    this.password = page.getByLabel("Password", { exact: true });
    this.confirmPassword = page.getByLabel("Confirm password");
    this.acceptTerms = page.getByLabel("I accept the terms and conditions");
    this.submit = page.getByRole("button", { name: "Register" });
  }

  async goto() {
    await this.page.goto("/register");
  }

  async register(user: NewUser) {
    await this.username.fill(user.username);
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.confirmPassword.fill(user.password);
    await this.acceptTerms.check();
    await this.submit.click();
  }
}
