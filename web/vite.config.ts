import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The web UI is served by Express on port 3000 (see src/server.ts):
// `npm run dev` runs Vite in middleware mode, `npm start` serves the build in web/dist.
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  clearScreen: false,
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  // Pre-bundle every dependency up front, so Vite never reloads the page in the middle of a test.
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router",
      "@tanstack/react-query",
    ],
  },
});
