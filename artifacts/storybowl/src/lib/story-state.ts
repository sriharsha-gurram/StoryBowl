// Pure reducer holding the whole toy's state, including stale-request protection.
// Exported separately so tests can prove late responses never repopulate the page.
import type { Story } from "@workspace/api-client-react";
import { catalog, type Mood } from "@workspace/story-core";

export const MAX = 10;
export const MIN = 3;

export interface State {
  ids: string[]; mood: Mood; query: string; category: string;
  phase: "idle" | "loading" | "ready" | "error";
  requestId: number; result: Story | null; error: string | null;
  history: Story[]; notice: string | null;
}
export type Action =
  | { type: "add"; id: string } | { type: "remove"; id: string } | { type: "mood"; mood: Mood }
  | { type: "query"; query: string } | { type: "category"; category: string }
  | { type: "set"; ids: string[] } | { type: "reset" } | { type: "start" }
  | { type: "status-error"; message: string }
  | { type: "success"; requestId: number; story: Story } | { type: "failure"; requestId: number; message: string };

export const initialState: State = {
  ids: [], mood: "calm", query: "", category: "All", phase: "idle", requestId: 0,
  result: null, error: null, history: [], notice: null,
};

// Any change to objects or mood invalidates in-flight work and clears the result.
const invalidate = (s: State, patch: Partial<State>): State =>
  ({ ...s, ...patch, requestId: s.requestId + 1, phase: "idle", result: null, error: null });

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "add":
      if (!catalog.some(o => o.id === a.id)) return s;
      if (s.ids.includes(a.id)) return s;
      if (s.ids.length >= MAX) return { ...s, notice: `Your object tray is full (${MAX} of ${MAX} objects)` };
      return invalidate(s, { ids: [...s.ids, a.id], notice: s.ids.length === MAX - 1 ? `Your object tray is full (${MAX} of ${MAX} objects)` : null });
    case "remove":
      return invalidate(s, { ids: s.ids.filter(i => i !== a.id), notice: null });
    case "set": return invalidate(s, { ids: a.ids.slice(0, MAX), notice: a.ids.length >= MAX ? `Your object tray is full (${MAX} of ${MAX} objects)` : null });
    case "mood": return a.mood === s.mood ? s : invalidate(s, { mood: a.mood });
    case "query": return { ...s, query: a.query };
    case "category": return { ...s, category: a.category };
    case "reset": return { ...initialState, history: s.history, requestId: s.requestId + 1 };
    case "status-error": return { ...s, error: a.message };
    case "start": return { ...s, phase: "loading", error: null, requestId: s.requestId + 1 };
    case "success":
      if (a.requestId !== s.requestId || s.phase !== "loading") return s;
      return { ...s, phase: "ready", result: a.story, history: [...s.history, a.story].slice(-2) };
    case "failure":
      if (a.requestId !== s.requestId || s.phase !== "loading") return s;
      return { ...s, phase: "error", error: a.message };
  }
}

export function surprise(): string[] {
  const pool = catalog.map(o => o.id);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j]!, pool[i]!]; }
  return pool.slice(0, 5);
}

export const openingOf = (story: string) => (story.match(/^[^.!?]*[.!?]?/)?.[0] ?? story).trim().slice(0, 160);
