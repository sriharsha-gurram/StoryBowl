// Frontend tests: every catalog id has an icon, and stale responses are ignored.
// These guard the two bugs most likely to slip in unnoticed.
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { catalog, fixtures } from "@workspace/story-core";
import { iconMap } from "./icons";
import { initialState, reducer } from "./story-state";

const story = { id: "x", objectIds: ["a"], mood: "calm", language: "en", title: "T", story: "S.", wordCount: 1, source: "demo" } as const;

describe("icons", () => {
  it("has an icon for every catalog id and no extras", () => {
    expect(catalog.every(o => iconMap[o.id])).toBe(true);
    expect(Object.keys(iconMap).length).toBe(catalog.length);
    expect(fixtures.calm.title).toBeTruthy();
  });
  it("renders every icon as an SVG", () => {
    for (const object of catalog) {
      expect(renderToStaticMarkup(createElement(iconMap[object.id]!))).toContain("<svg");
    }
  });
});

describe("reducer stale handling", () => {
  const loading = () => {
    let s = reducer(initialState, { type: "set", ids: ["cat", "lamp", "rain"] });
    s = reducer(s, { type: "start" });
    return s;
  };
  it("accepts the current response", () => {
    const s = loading();
    expect(reducer(s, { type: "success", requestId: s.requestId, story }).phase).toBe("ready");
  });
  it("ignores a response after the selection changed", () => {
    const s = loading(); const old = s.requestId;
    const changed = reducer(s, { type: "remove", id: "cat" });
    expect(reducer(changed, { type: "success", requestId: old, story }).result).toBeNull();
  });
  it("ignores late responses and errors after reset", () => {
    const s = loading(); const old = s.requestId;
    const r = reducer(s, { type: "reset" });
    expect(reducer(r, { type: "success", requestId: old, story })).toEqual(r);
    expect(reducer(r, { type: "failure", requestId: old, message: "no" })).toEqual(r);
  });
  it("keeps only the last two stories", () => {
    let s = initialState;
    for (let i = 0; i < 3; i++) { s = reducer(s, { type: "start" }); s = reducer(s, { type: "success", requestId: s.requestId, story: { ...story, id: String(i) } }); }
    expect(s.history.map(h => h.id)).toEqual(["1", "2"]);
  });
  it("handles 3, 5 and 10 ingredients, duplicate adds and full bowl", () => {
    let s = initialState;
    for (const [i, object] of catalog.slice(0, 10).entries()) {
      s = reducer(s, { type: "add", id: object.id });
      expect(s.ids).toHaveLength(i + 1);
    }
    expect(reducer(s, { type: "add", id: s.ids[0]! })).toBe(s);
    expect(reducer(s, { type: "add", id: catalog[10]!.id }).notice).toBe("The bowl is full (10 of 10)");
    expect(reducer(s, { type: "add", id: "unknown" })).toBe(s);
    expect(reducer(s, { type: "remove", id: s.ids[0]! }).ids).toHaveLength(9);
  });
  it("clears result for every mood change and reset restores filters", () => {
    let s = loading();
    s = reducer(s, { type: "success", requestId: s.requestId, story });
    for (const mood of ["funny", "mystery", "calm"] as const) {
      s = reducer(s, { type: "mood", mood });
      expect(s.result).toBeNull();
      expect(s.phase).toBe("idle");
    }
    s = reducer(s, { type: "query", query: "cat" });
    s = reducer(s, { type: "category", category: "Animals" });
    const reset = reducer(s, { type: "reset" });
    expect(reset.ids).toEqual([]);
    expect(reset.query).toBe("");
    expect(reset.category).toBe("All");
    expect(reset.mood).toBe("calm");
  });
  it("New story retains its ingredients and saved result while pending", () => {
    const s = loading();
    const ready = reducer(s, { type: "success", requestId: s.requestId, story });
    const next = reducer(ready, { type: "start" });
    expect(next.ids).toEqual(ready.ids);
    expect(next.result).toEqual(ready.result);
    expect(next.phase).toBe("loading");
    expect(reducer(next, { type: "success", requestId: s.requestId, story })).toEqual(next);
  });
});
