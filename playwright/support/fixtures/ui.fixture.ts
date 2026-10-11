import { test as base, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
// import { RegisterPage } from "../pages/RegisterPage";

// Assignment 2: your UI fixtures. Import `test` and `expect` from this file in your specs:
//   import { test, expect } from "../../support/fixtures/ui.fixture";
type UiFixtures = {
  loginPage: LoginPage;
  // TODO: registerPage: RegisterPage;
};

export const test = base.extend<UiFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  // TODO: registerPage, and later on whatever else your tests need
});

export { expect };
