// Serves status and stories without storing any user selections or fiction.
// Strict registry validation keeps prompts server-owned and demo mode honest.
import { Router, type IRouter } from "express";
import { isIP } from "node:net";
import { randomUUID } from "node:crypto";
import { GenerateStoryBody, GenerateStoryResponse, GetStoryStatusResponse } from "@workspace/api-zod";
import { exampleIds, fixtures, validPayload, words } from "@workspace/story-core";
import { createStory, StoryFailure, StoryLimiter } from "../lib/story";
const router: IRouter = Router();
const limiter = new StoryLimiter();
const isDemo = () => !process.env.GROQ_API_KEY || process.env.DEMO_MODE === "true";
router.get("/status", (_req, res) => {
  res.set("Cache-Control", "no-store").json(GetStoryStatusResponse.parse({ demo: isDemo() }));
});
router.post("/story", async (req, res): Promise<void> => {
  res.set("Cache-Control", "no-store");
  if (!GenerateStoryBody.safeParse(req.body).success || !validPayload(req.body)) {
    const error = new StoryFailure("BAD_REQUEST", 400);
    res.status(error.status).json({ code: error.code, message: error.message }); return;
  }
  // Do not use the leftmost, client-controlled forwarding value or arbitrary IP headers.
  // Deployment must remain behind Replit's trusted proxy; direct serving uses socket IP.
  const forwarded = req.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const ip = forwarded && isIP(forwarded) ? forwarded : req.socket.remoteAddress ?? "unknown";
  if (!limiter.allow(ip)) {
    const error = new StoryFailure("RATE_LIMITED", 429);
    res.set("Retry-After", "600").status(error.status).json({ code: error.code, message: error.message }); return;
  }
  const controller = new AbortController();
  const onClose = () => { if (!res.writableEnded) controller.abort(); };
  res.on("close", onClose);
  try {
    const payload = req.body;
    const demo = isDemo();
    if (demo && (payload.objectIds.length !== 5 || !exampleIds.every(id => payload.objectIds.includes(id)))) {
      throw new StoryFailure("NO_API_KEY", 503);
    }
    const result = demo ? fixtures[payload.mood] : await createStory(payload, {
      key: process.env.GROQ_API_KEY!, model: process.env.GROQ_MODEL || "openai/gpt-oss-20b", signal: controller.signal,
    });
    if (!controller.signal.aborted) res.json(GenerateStoryResponse.parse({
      id: randomUUID(), ...result, objectIds: payload.objectIds, mood: payload.mood, language: "en",
      wordCount: words(result.story).length, source: demo ? "demo" : "ai",
    }));
  } catch (error) {
    const friendly = error instanceof StoryFailure ? error : new StoryFailure("PROVIDER_REFUSED");
    if (!controller.signal.aborted) res.status(friendly.status).json({ code: friendly.code, message: friendly.message });
  } finally { res.off("close", onClose); }
});
export default router;
