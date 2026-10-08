import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, vi } from "vitest";
import { MockUtterance, resetSpeech, speechMock } from "./speech-mock";

// Install before use-speech.ts evaluates its module-level capability check.
vi.stubGlobal("speechSynthesis", speechMock);
vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);

beforeEach(() => {
  resetSpeech();
  // Fail closed: an accidental unmocked API call cannot reach Groq or any server.
  vi.stubGlobal("fetch", vi.fn(() => {
    throw new Error("Network is disabled in StoryBowl interaction tests");
  }));
});
afterEach(() => {
  cleanup();
  expect(fetch).not.toHaveBeenCalled();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
