// Shares plain story text and the verified public app link, never the preview URL.
// Native dismissal is respected; unsupported sharing falls back to clipboard or manual copy.
import type { Story } from "@workspace/api-client-react";

export const APP_SHARE_URL = "https://story-bowl.replit.app";
export type ShareOutcome = { kind: "shared" | "copied" | "cancelled" | "manual"; text?: string };
export async function shareStory(story: Pick<Story, "title" | "story">): Promise<ShareOutcome> {
  const text = `${story.title}\n\n${story.story}\n\nMade with StoryBowl\n${APP_SHARE_URL}`;
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: story.title, text, url: APP_SHARE_URL });
      return { kind: "shared" };
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return { kind: "cancelled" };
    }
  }
  try { await navigator.clipboard.writeText(text); return { kind: "copied" }; }
  catch { return { kind: "manual", text }; }
}
