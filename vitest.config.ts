// Both projects run without workflow ports, provider credentials, or real speech.
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["lib/story-core/**/*.test.ts", "artifacts/api-server/src/**/*.test.ts", "artifacts/storybowl/src/**/*.test.ts"],
        },
      },
      "artifacts/storybowl/vitest.config.ts",
    ],
  },
});
