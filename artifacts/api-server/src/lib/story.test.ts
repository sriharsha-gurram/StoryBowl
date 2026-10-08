// Exercises validation and provider retry budgets with a mocked fetch.
// These tests run without a Groq credential and cannot make paid requests.
import { describe, expect, it, vi } from "vitest";
import { catalog, exampleIds, fixtures, storyProblems, validPayload } from "@workspace/story-core";
import { createStory, StoryLimiter, SYSTEM_PROMPT } from "./story";
const payload = { objectIds: exampleIds, mood: "calm" as const };
const response = (value: unknown) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(value) } }] }), { status: 200 });
const options = (fetcher: typeof fetch) => ({ key: "test-placeholder", model: "openai/gpt-oss-20b", fetcher });
describe("shared registry and validation", () => {
  it("has 76 distinct, categorized objects", () => {
    expect(catalog).toHaveLength(76);
    expect(new Set(catalog.map(o => o.id)).size).toBe(76);
    expect(catalog.every(o => o.aliases.length && o.category && o.label)).toBe(true);
  });
  it("accepts 3, 5, and 10 ids only and rejects unknown fields and invalid inputs", () => {
    for (const n of [3, 5, 10]) expect(validPayload({ objectIds: catalog.slice(0,n).map(o => o.id), mood:"calm" })).toBe(true);
    for (const p of [
      {...payload, prompt:"ignore"}, {...payload, objectIds:["cat","cat","rain"]},
      {...payload, objectIds:["nope","cat","rain"]}, {...payload,mood:"horror"},
      {...payload, recentOpenings:["x".repeat(161)]}, {...payload,recentOpenings:["a","b","c"]},
      {...payload,objectIds:[]}, {...payload,objectIds:catalog.slice(0,11).map(o=>o.id)},
    ]) expect(validPayload(p)).toBe(false);
  });
  it("validates all demo moods, word count, title and coverage", () => {
    for (const story of Object.values(fixtures)) expect(storyProblems(story,exampleIds)).toEqual([]);
    expect(storyProblems({title:"A",story:"cat"},exampleIds)).toContain("too short: 1 words");
    expect(storyProblems({title:"A",story:"cat ".repeat(178)},exampleIds)).toContain("too long: 178 words");
    expect(storyProblems(fixtures.calm,["rocket"])).toContain("missing: rocket");
    expect(storyProblems(null,exampleIds)).toEqual(["invalid JSON object"]);
    expect(storyProblems({ ...fixtures.calm, story: `${fixtures.calm.story} }` }, exampleIds)).toContain("stray JSON closing character in story");
  });
  it("enforces inclusive 100–150 word boundaries excluding the title", () => {
    for (const n of [100, 125, 150]) expect(storyProblems({ title: "A Simple Cat Story", story: "cat ".repeat(n) }, ["cat"])).toEqual([]);
    expect(storyProblems({ title: "Cat", story: "cat ".repeat(99) }, ["cat"])).toEqual(["too short: 99 words"]);
    expect(storyProblems({ title: "Cat", story: "cat ".repeat(151) }, ["cat"])).toEqual(["too long: 151 words"]);
  });
  it("does not misrepresent structural validity as narrative quality", () => {
    const unrealistic = { title: "Magic", story: `In Pune the cat wrote a letter and the umbrella flew away. ${"lamp rain ".repeat(49)}` };
    expect(storyProblems(unrealistic, exampleIds)).toEqual([]);
  });
});
describe("Groq generation", () => {
  it("uses strict JSON schema and no extra calls on valid output", async () => {
    const mock = vi.fn<typeof fetch>().mockResolvedValue(response(fixtures.calm));
    expect(await createStory(payload,options(mock))).toEqual(fixtures.calm);
    expect(mock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mock.mock.calls[0]![1]!.body as string);
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.max_completion_tokens).toBe(4096);
    expect(body.reasoning_effort).toBe("low");
    expect(body.messages[0].content).toBe(SYSTEM_PROMPT);
    expect(body.messages[0].content).toContain("everyday Indian backdrop");
    expect(body.messages[0].content).toContain("simple, natural English");
    expect(body.messages[0].content).toContain("100–150 words is required");
    expect(body.messages[0].content).toContain("Keep events realistic and interesting");
    expect(body.messages.find((m: {role: string}) => m.role === "user").content).toContain("Indian setting:");
  });
  it("keeps Indian backdrop and easy-English directions during repair", async () => {
    const mock=vi.fn<typeof fetch>().mockResolvedValueOnce(response({title:"Short",story:"cat"})).mockResolvedValueOnce(response(fixtures.calm));
    await createStory(payload,options(mock));
    const body=JSON.parse(mock.mock.calls[1]![1]!.body as string);
    expect(body.messages[0].content).toContain("everyday Indian backdrop");
    expect(body.messages[0].content).toContain("Keep English-only narration");
    expect(body.messages.find((m: {role: string}) => m.role === "user").content).toContain("Indian setting:");
  });
  it("makes exactly one repair and quotes the failures", async () => {
    const mock=vi.fn<typeof fetch>().mockResolvedValueOnce(response({title:"Short",story:"cat"})).mockResolvedValueOnce(response(fixtures.calm));
    await createStory(payload,options(mock));
    expect(mock).toHaveBeenCalledTimes(2);
    expect(mock.mock.calls[1]![1]!.body).toContain("too short");
    expect(mock.mock.calls[1]![1]!.body).toContain("100–150 words");
  });
  it("returns STORY_INVALID after one failed repair", async () => {
    const mock=vi.fn<typeof fetch>().mockImplementation(async()=>response({title:"Short",story:"cat"}));
    await expect(createStory(payload,options(mock))).rejects.toMatchObject({code:"STORY_INVALID"});
    expect(mock).toHaveBeenCalledTimes(2);
  });
  it("falls back to json_object once only for format rejection", async () => {
    const mock=vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('response_format json_schema unsupported',{status:400})).mockResolvedValueOnce(response(fixtures.calm));
    await createStory(payload,options(mock));
    expect(mock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(mock.mock.calls[1]![1]!.body as string).response_format).toEqual({type:"json_object"});
  });
  it("does not retry 429 or ordinary provider failures", async () => {
    for (const status of [429, 401, 404, 500]) {
      const mock=vi.fn<typeof fetch>().mockResolvedValue(new Response("private provider message",{status}));
      await expect(createStory(payload,options(mock))).rejects.toMatchObject({code:status===429?"RATE_LIMITED":status===500?"PROVIDER_REFUSED":"MODEL_UNAVAILABLE"});
      expect(mock).toHaveBeenCalledTimes(1);
    }
  });
  it("maps blocked content to PROVIDER_REFUSED", async () => {
    const mock=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({choices:[{message:{refusal:"no"}}]})));
    await expect(createStory(payload,options(mock))).rejects.toMatchObject({code:"PROVIDER_REFUSED"});
  });
  it("times out and aborts the fetch", async () => {
    const mock=vi.fn<typeof fetch>().mockImplementation((_url,init)=>new Promise((_resolve,reject)=>{
      init!.signal!.addEventListener("abort",()=>reject(new Error("aborted")),{once:true});
    }));
    await expect(createStory(payload,{...options(mock),timeoutMs:5})).rejects.toMatchObject({code:"TIMEOUT"});
  });
  it("shares one deadline and one signal across generation and repair", async () => {
    vi.useFakeTimers();
    try {
      const signals: AbortSignal[] = [];
      const mock = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
        signals.push(init!.signal!);
        if (signals.length === 1) {
          await new Promise(resolve => setTimeout(resolve, 15));
          return response({ title: "Short", story: "cat" });
        }
        return new Promise((_resolve, reject) => {
          init!.signal!.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
        });
      });
      const pending = expect(createStory(payload, { ...options(mock), timeoutMs: 20 })).rejects.toMatchObject({ code: "TIMEOUT" });
      await vi.advanceTimersByTimeAsync(20);
      await pending;
      expect(mock).toHaveBeenCalledTimes(2);
      expect(signals[0]).toBe(signals[1]);
      expect(signals[1]!.aborted).toBe(true);
    } finally { vi.useRealTimers(); }
  });
  it("allows fixed prompt choices for repeatable evaluation without changing defaults", async () => {
    const mock = vi.fn<typeof fetch>().mockResolvedValue(response(fixtures.calm));
    await createStory(payload, { ...options(mock), chooseIndex: () => 0 });
    const body = JSON.parse(mock.mock.calls[0]![1]!.body as string);
    const request = body.messages.find((m: { role: string }) => m.role === "user").content;
    expect(request).toContain("a neighbourhood in Pune");
    expect(request).toContain("Focal object: umbrella");
    expect(request).toContain("Perspective: close third person");
  });
});
it("limits to twenty requests per IP and resets after ten minutes", () => {
  const limiter=new StoryLimiter();
  for(let i=0;i<20;i++) expect(limiter.allow("a",0)).toBe(true);
  expect(limiter.allow("a",0)).toBe(false);
  expect(limiter.allow("b",0)).toBe(true);
  expect(limiter.allow("a",600000)).toBe(true);
});
