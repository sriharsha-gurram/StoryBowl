// Sharing checks use stubbed browser APIs, never an actual clipboard or external service.
// Every fallback carries the title and public app link without copying after dismissal.
import { afterEach, describe, expect, it, vi } from "vitest";
import { APP_SHARE_URL, shareStory } from "./share-story";
afterEach(() => vi.unstubAllGlobals());
const story = { title: "A Quiet Visit", story: "A complete story." };
describe("story sharing", () => {
  it("uses native sharing when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { share, clipboard: { writeText } });
    expect(await shareStory(story)).toEqual({ kind: "shared" });
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: story.title, text: expect.stringContaining(APP_SHARE_URL) }));
    expect(writeText).not.toHaveBeenCalled();
  });
  it("copies the title, story and link without native sharing", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    expect(await shareStory(story)).toEqual({ kind: "copied" });
    expect(writeText.mock.calls[0]![0]).toContain(story.title);
    expect(writeText.mock.calls[0]![0]).toContain(story.story);
    expect(writeText.mock.calls[0]![0]).toContain(APP_SHARE_URL);
  });
  it("does not copy when the user cancels the native sheet", async () => {
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(new DOMException("Cancel", "AbortError")), clipboard: { writeText } });
    expect(await shareStory(story)).toEqual({ kind: "cancelled" });
    expect(writeText).not.toHaveBeenCalled();
  });
  it("offers selectable text if native sharing and clipboard both fail", async () => {
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(new Error("unsupported")), clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    expect(await shareStory(story)).toEqual({ kind: "manual", text: expect.stringContaining(APP_SHARE_URL) });
  });
});
