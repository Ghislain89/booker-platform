import { test as setup, expect } from "@playwright/test";
import { LoginPage } from "../../support/pages/LoginPage";
import {
  ADMIN_STATE,
  apiLogin,
  SEEDED_ADMIN,
  SEEDED_USER,
  USER_STATE,
} from "../../support/auth";

setup("log in as user through the login form", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(SEEDED_USER.username, SEEDED_USER.password);
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  await page.context().storageState({ path: USER_STATE });
});

// Bonus: skip the login form. The web app keeps its token in localStorage.
setup("log in as admin through the API", async ({ page, request }) => {
  const token = await apiLogin(request, SEEDED_ADMIN);
  await page.goto("/");
  await page.evaluate(
    (value) => localStorage.setItem("booker.token", value),
    token,
  );
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Room management" }),
  ).toBeVisible();
  await page.context().storageState({ path: ADMIN_STATE });
});
