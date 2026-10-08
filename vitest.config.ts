// Runs focused unit tests for shared validation, provider calls, and UI state.
// A separate configuration avoids requiring workflow ports to run tests.
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["lib/story-core/**/*.test.ts", "artifacts/api-server/src/**/*.test.ts", "artifacts/storybowl/src/**/*.test.ts"] },
});
