import { test as baseTest } from "@playwright/test";
import { ApiFixture } from "./api.fixture.ts";

export const test = baseTest.extend<{
  api: ApiFixture;
}>({
  api: async ({ request }, use) => {
    await use(new ApiFixture(request));
  },
});
