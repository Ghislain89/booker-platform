import { expect as baseExpect } from "@playwright/test";
import { ZodTypeAny } from "zod";

export const expect = baseExpect.extend({
  async toMatchSchema(received: any, schema: ZodTypeAny) {
    const result = await schema.safeParseAsync(received);
    if (result.success) {
      return {
        message: () => "schema matched",
        pass: true,
      };
    } else {
      return {
        message: () =>
          "Result does not match schema: " +
          result.error.issues.map((issue) => issue.message).join("\n") +
          "\n" +
          "Details: " +
          JSON.stringify(result.error, null, 2),
        pass: false,
      };
    }
  },
});
