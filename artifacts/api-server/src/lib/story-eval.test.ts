// Offline by default; an explicit flag permits a bounded, sequential live writing sample.
// Saves public fiction, prompt and usage only, never credentials or raw provider errors.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { setTimeout as wait } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { storyProblems, validPayload, words } from "@workspace/story-core";
import { createStory, StoryFailure, SYSTEM_PROMPT } from "./story";
import { evaluationCases, qualityRubric } from "./story-eval.cases";

it("covers every size/mood combination with valid, fixed selections", () => {
  expect(evaluationCases).toHaveLength(9);
  expect(new Set(evaluationCases.map(c => c.id)).size).toBe(9);
  expect(evaluationCases.every(c => validPayload(c.payload))).toBe(true);
  expect(Object.keys(qualityRubric)).toHaveLength(5);
});

describe.skipIf(process.env.STORY_EVAL_LIVE !== "1")("explicit live quality evaluation", () => {
  it("records nine samples using the production repair and timeout budgets", async () => {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("Existing GROQ_API_KEY is required for an explicitly enabled live evaluation.");
    const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
    const label = process.env.STORY_EVAL_LABEL || "sample";
    if (!/^[a-z0-9-]+$/i.test(label)) throw new Error("Use a simple evaluation label.");
    const selectedIds = process.env.STORY_EVAL_CASES?.split(",");
    if (selectedIds?.some(id => !evaluationCases.some(c => c.id === id))) throw new Error("Unknown evaluation case.");
    const cases = evaluationCases.filter(c => !selectedIds || selectedIds.includes(c.id));
    const output = resolve("docs/story-quality", `${label}.json`);
    const report = {
      recordedAt: new Date().toISOString(), model, label, systemPrompt: SYSTEM_PROMPT,
      controls: { choiceIndex: 0, temperature: 0.7, timeoutMs: 20000, maxRepair: 1, caseIds: cases.map(c => c.id), pacingMs: 15000 },
      rubric: qualityRubric, samples: [] as unknown[],
    };
    await mkdir(dirname(output), { recursive: true });
    // Refuse to overwrite earlier evidence; choose a fresh label for every run.
    await writeFile(output, JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
    for (const testCase of cases) {
      // Dataset pacing is outside each story's shared 20-second deadline.
      await wait(15000);
      const calls: unknown[] = [];
      const fetcher: typeof fetch = async (url, init) => {
        const body = JSON.parse(init!.body as string);
        const start = performance.now();
        const response = await fetch(url, init);
        const safe: Record<string, unknown> = {
          status: response.status, elapsedMs: Math.round(performance.now() - start),
          responseFormat: body.response_format.type,
          repair: body.messages.some((m: { role: string }) => m.role === "assistant"),
        };
        if (response.ok) {
          const data = await response.clone().json() as {
            usage?: {
              prompt_tokens?: number; completion_tokens?: number; total_tokens?: number;
              completion_tokens_details?: { reasoning_tokens?: number };
              queue_time?: number; prompt_time?: number; completion_time?: number; total_time?: number;
            };
            choices?: { message?: { content?: string } }[];
          };
          // Whitelist telemetry and story content; no headers, reasoning or error text.
          const usage = data.usage;
          safe.usage = usage ? {
            promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
            reasoningTokens: usage.completion_tokens_details?.reasoning_tokens,
            queueTime: usage.queue_time, promptTime: usage.prompt_time,
            completionTime: usage.completion_time, totalTime: usage.total_time,
          } : null;
          safe.content = data.choices?.[0]?.message?.content ?? "";
        }
        calls.push(safe);
        return response;
      };
      const start = performance.now();
      let result: unknown;
      try {
        const story = await createStory(testCase.payload, { key, model, fetcher, chooseIndex: () => 0 });
        result = { ...story, wordCount: words(story.story).length, structuralProblems: storyProblems(story, testCase.payload.objectIds) };
      } catch (error) {
        result = { error: error instanceof StoryFailure ? error.code : "EVALUATION_FAILED" };
      }
      report.samples.push({
        ...testCase, elapsedMs: Math.round(performance.now() - start), calls, result,
        humanReview: null,
      });
      await writeFile(output, JSON.stringify(report, null, 2) + "\n");
    }
    expect(report.samples).toHaveLength(cases.length);
  }, 330_000);
});
