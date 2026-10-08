import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Do not import vite.config.ts: interaction tests need neither PORT nor BASE_PATH.
export default defineConfig({
  root: import.meta.dirname,
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    name: "storybowl-dom",
    environment: "jsdom",
    include: ["src/**/*.test.tsx"],
    setupFiles: ["src/test/setup.ts"],
    clearMocks: true,
  },
});
