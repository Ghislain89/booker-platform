import playwright from "eslint-plugin-playwright";
import tseslint from "typescript-eslint";

const recommended = playwright.configs["flat/recommended"];

// npm run lint: the recommended eslint-plugin-playwright rules for the tests.
export default [
  {
    ...recommended,
    files: ["playwright/**/*.ts"],
    languageOptions: { ...recommended.languageOptions, parser: tseslint.parser },
    settings: {
      // auth.setup.ts imports `test as setup`
      playwright: { globalAliases: { test: ["setup"] } },
    },
  },
];
