import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import { PORT, TEST_API_ENABLED } from "./env";

const openapiDir = path.join(__dirname, "..", "openapi");

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Booker Platform API",
      version: "1.0.0",
      description:
        "API of the Booker hotel, the test object for the DeTesters Playwright training. " +
        "Log in with `admin` / `password123` or `user` / `password123` and click Authorize.",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(openapiDir, "api.yaml"), ...(TEST_API_ENABLED ? [path.join(openapiDir, "testing.yaml")] : [])],
};

export const swaggerSpec = swaggerJsdoc(options);
