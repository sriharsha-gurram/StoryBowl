// Deterministic retry checks never use a real API credential or provider request.
// Fake clocks prove delays, cancellation, and the strict three-attempt budget.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateStory, type Story } from "@workspace/api-client-react";
import { generateWithRetry } from "./generate-with-retry";
vi.mock("@workspace/api-client-react", () => ({ generateStory: vi.fn() }));
const generate = vi.mocked(generateStory);
const story = { id: "success" } as Story;
beforeEach(() => { vi.useFakeTimers(); generate.mockReset(); });
afterEach(() => { vi.useRealTimers(); });
describe("temporary storyteller failures", () => {
  it("retries twice with pauses and never reports the first failure", async () => {
    generate.mockRejectedValueOnce({ status: 503 }).mockRejectedValueOnce(new TypeError("network")).mockResolvedValue(story);
    const onRetry = vi.fn();
    const pending = generateWithRetry({ objectIds: ["cat", "rain", "lamp"], mood: "calm" }, { signal: new AbortController().signal, onRetry });
    await vi.advanceTimersByTimeAsync(649);
    expect(generate).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(generate).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1300);
    expect(await pending).toBe(story);
    expect(generate).toHaveBeenCalledTimes(3);
    expect(onRetry.mock.calls).toEqual([[2], [3]]);
  });
  it("stops after three failed attempts", async () => {
    generate.mockRejectedValue({ status: 502 });
    const pending = generateWithRetry({ objectIds: ["cat", "rain", "lamp"], mood: "calm" }, { signal: new AbortController().signal });
    const assertion = expect(pending).rejects.toEqual({ status: 502 });
    await vi.runAllTimersAsync(); await assertion;
    expect(generate).toHaveBeenCalledTimes(3);
  });
  it("cancels during the pause without making another request", async () => {
    generate.mockRejectedValue({ status: 502 });
    const controller = new AbortController();
    const pending = generateWithRetry({ objectIds: ["cat", "rain", "lamp"], mood: "calm" }, { signal: controller.signal });
    const assertion = expect(pending).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(1); controller.abort();
    await assertion; await vi.runAllTimersAsync();
    expect(generate).toHaveBeenCalledTimes(1);
  });
  it("does not retry a permanent setup or invalid-input error", async () => {
    generate.mockRejectedValue({ status: 400, data: { code: "BAD_REQUEST" } });
    await expect(generateWithRetry({ objectIds: [], mood: "calm" }, { signal: new AbortController().signal })).rejects.toMatchObject({ status: 400 });
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
