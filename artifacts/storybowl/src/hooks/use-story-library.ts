// Browser-local story library: every accepted story, favorites, removal. Versioned localStorage
// with validation; if storage is unavailable or full we keep stories in memory and say so.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Story } from "@workspace/api-client-react";
import { catalog } from "@workspace/story-core";

export interface LibraryEntry { story: Story; savedAt: number; favorite: boolean }
const KEY = "storybowl.library";
const VERSION = 1;
const objectIds = new Set(catalog.map(o => o.id));

const isStory = (v: unknown): v is Story => {
  const s = v as Record<string, unknown> | null;
  return !!s && typeof s === "object" && typeof s.id === "string" && typeof s.title === "string" &&
    !!s.id.trim() && !!s.title.trim() && typeof s.story === "string" && !!s.story.trim() &&
    Array.isArray(s.objectIds) && s.objectIds.length >= 3 && s.objectIds.length <= 10 &&
    new Set(s.objectIds).size === s.objectIds.length && s.objectIds.every(i => typeof i === "string" && objectIds.has(i)) &&
    s.language === "en" && (s.source === "ai" || s.source === "demo") &&
    typeof s.wordCount === "number" && Number.isFinite(s.wordCount) && s.wordCount > 0 &&
    (s.mood === "calm" || s.mood === "funny" || s.mood === "mystery");
};
const isEntry = (v: unknown): v is LibraryEntry => {
  const e = v as Record<string, unknown> | null;
  return !!e && typeof e === "object" && isStory(e.story) && typeof e.savedAt === "number" && Number.isFinite(e.savedAt) && typeof e.favorite === "boolean";
};

function read(): { entries: LibraryEntry[]; notice: string | null; writable: boolean } {
  let raw: string | null;
  try { raw = window.localStorage.getItem(KEY); } catch {
    return { entries: [], writable: false, notice: "This browser is blocking local storage, so stories will only be kept until you close the tab." };
  }
  if (!raw) return { entries: [], notice: null, writable: true };
  try {
    const parsed = JSON.parse(raw) as { version?: unknown; entries?: unknown };
    if (parsed?.version !== VERSION || !Array.isArray(parsed.entries)) throw new Error("shape");
    const entries = parsed.entries.filter(isEntry);
    const skipped = parsed.entries.length - entries.length;
    return { entries, writable: skipped === 0, notice: skipped ? "Some saved stories couldn't be read. Your stored library is untouched; changes are kept for this visit only." : null };
  } catch {
    return { entries: [], writable: false, notice: "Your saved library couldn't be read. It was left untouched; new stories are kept for this visit." };
  }
}

export function useStoryLibrary() {
  const [state, setState] = useState(() => (typeof window === "undefined" ? { entries: [], notice: null, writable: false } : read()));
  const entriesRef = useRef(state.entries);
  entriesRef.current = state.entries;
  const commit = useCallback((update: (entries: LibraryEntry[]) => LibraryEntry[]) => {
    // Re-read before mutation so a new story in another tab is not overwritten.
    const disk = read();
    const base = disk.writable
      ? [...entriesRef.current.filter(e => !disk.entries.some(d => d.story.id === e.story.id)), ...disk.entries]
      : entriesRef.current;
    const next = update(base);
    let notice = disk.notice;
    try {
      if (!disk.writable) {
        entriesRef.current = next;
        setState({ entries: next, notice, writable: false });
        return;
      }
      window.localStorage.setItem(KEY, JSON.stringify({ version: VERSION, entries: next }));
    } catch (e) {
      const quota = e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22);
      notice = quota
        ? "Browser storage is full. Nothing was deleted; newer stories are kept for this visit only."
        : "Stories can't be saved in this browser right now; they're kept until you close the tab.";
    }
    entriesRef.current = next;
    setState({ entries: next, notice, writable: !notice });
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY && e.key !== null) return;
      const next = read(); entriesRef.current = next.entries; setState(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const save = useCallback((story: Story) => {
    const cur = entriesRef.current;
    if (cur.some(e => e.story.id === story.id)) return;
    commit(entries => entries.some(e => e.story.id === story.id) ? entries : [{ story, savedAt: Date.now(), favorite: false }, ...entries]);
  }, [commit]);
  const toggleFavorite = useCallback((id: string) => {
    commit(entries => entries.map(e => (e.story.id === id ? { ...e, favorite: !e.favorite } : e)));
  }, [commit]);
  const remove = useCallback((id: string) => {
    commit(entries => entries.filter(e => e.story.id !== id));
  }, [commit]);

  return { entries: state.entries, save, toggleFavorite, remove, notice: state.notice };
}
