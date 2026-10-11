// Retries temporary storyteller failures without letting an abandoned request continue.
// One original request plus two retries is the entire budget for a user action.
import { generateStory, type Story, type StoryInput } from "@workspace/api-client-react";

export const STORY_HICCUP = "Our storyteller had a hiccup. Your objects are still here. Try again when you're ready.";

function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException("Aborted", "AbortError")); return; }
    const abort = () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}

export async function generateWithRetry(payload: StoryInput, options: {
  signal: AbortSignal; onRetry?: (attempt: number) => void;
}): Promise<Story> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    options.signal.throwIfAborted();
    try {
      const story = await generateStory(payload, { signal: options.signal });
      options.signal.throwIfAborted();
      return story;
    } catch (error) {
      if (options.signal.aborted || (error as Error)?.name === "AbortError") throw error;
      const status = (error as { status?: number })?.status;
      const code = (error as { data?: { code?: string } })?.data?.code;
      const permanent = ["NO_API_KEY", "BAD_REQUEST", "MODEL_UNAVAILABLE"].includes(code ?? "")
        || (status !== undefined && [400, 401, 403, 404].includes(status));
      if (permanent || attempt === 3) throw error;
      options.onRetry?.(attempt + 1);
      await pause(attempt * 650, options.signal);
    }
  }
  throw new Error(STORY_HICCUP);
}
