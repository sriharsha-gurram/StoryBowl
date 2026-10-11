// Browser-local history checks cover reload, favorites, deletion, quota and corrupt storage.
// These checks never generate a story or call a backend.
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Story } from "@workspace/api-client-react";
import { exampleIds, fixtures, words } from "@workspace/story-core";
import { useStoryLibrary } from "./use-story-library";
const story: Story = { ...fixtures.calm, id: "saved", objectIds: exampleIds, mood: "calm", language: "en", source: "ai", wordCount: words(fixtures.calm.story).length };
describe("local story library", () => {
  it("saves once, stars, survives a reload, and deletes permanently", () => {
    const hook = renderHook(useStoryLibrary);
    act(() => { hook.result.current.save(story); hook.result.current.save(story); hook.result.current.toggleFavorite(story.id); });
    expect(hook.result.current.entries).toHaveLength(1);
    expect(hook.result.current.entries[0]!.favorite).toBe(true);
    hook.unmount();
    const reloaded = renderHook(useStoryLibrary);
    expect(reloaded.result.current.entries[0]!.story).toEqual(story);
    act(() => reloaded.result.current.remove(story.id));
    expect(reloaded.result.current.entries).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem("storybowl.library")!).entries).toEqual([]);
  });
  it("never overwrites an unreadable stored library", () => {
    localStorage.setItem("storybowl.library", "{broken");
    const hook = renderHook(useStoryLibrary);
    act(() => hook.result.current.save(story));
    expect(hook.result.current.entries).toHaveLength(1);
    expect(hook.result.current.notice).toMatch(/couldn't be read/);
    expect(localStorage.getItem("storybowl.library")).toBe("{broken");
  });
  it("preserves saved data and new in-memory stories when storage fills up", () => {
    localStorage.setItem("storybowl.library", JSON.stringify({ version: 1, entries: [{ story, savedAt: 1, favorite: false }] }));
    const hook = renderHook(useStoryLibrary);
    const old = localStorage.getItem("storybowl.library");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("full", "QuotaExceededError"); });
    act(() => hook.result.current.save({ ...story, id: "new" }));
    expect(hook.result.current.entries).toHaveLength(2);
    expect(hook.result.current.notice).toMatch(/storage is full/);
    expect(localStorage.getItem("storybowl.library")).toBe(old);
  });
  it("rejects unknown object ids so reopening cannot crash the picker", () => {
    localStorage.setItem("storybowl.library", JSON.stringify({ version: 1, entries: [{ story: { ...story, objectIds: ["bad", "cat", "rain"] }, savedAt: 1, favorite: false }] }));
    const hook = renderHook(useStoryLibrary);
    expect(hook.result.current.entries).toEqual([]);
    expect(hook.result.current.notice).toMatch(/couldn't be read/);
  });
});
