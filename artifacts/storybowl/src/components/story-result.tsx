// StoryResult: shows the finished story and its single set of follow-up actions.
// It is plain text only, with a select-the-text fallback when copying fails.
import { useRef, useState } from "react";
import { Copy, Play, RefreshCw, Square } from "lucide-react";
import type { Story } from "@workspace/api-client-react";

interface Props { story: Story; loading: boolean; speaking: boolean; blocked: boolean; supported: boolean; onPlay: () => void; onStop: () => void; onNew: () => void }

export function StoryResult({ story, loading, speaking, blocked, supported, onPlay, onStop, onNew }: Props) {
  const [copied, setCopied] = useState("");
  const textRef = useRef<HTMLDivElement>(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${story.title}\n\n${story.story}`);
      setCopied("Copied");
    } catch {
      const sel = window.getSelection(); const r = document.createRange();
      if (textRef.current && sel) { r.selectNodeContents(textRef.current); sel.removeAllRanges(); sel.addRange(r); }
      setCopied("Text selected. Press Ctrl+C to copy.");
    }
  };
  const btn = "inline-flex items-center gap-1.5 rounded-xl border border-[#9A97A8] bg-white px-3 py-2 text-sm font-medium hover:bg-[#F0EDFF] disabled:opacity-50";
  return (
    <article className="rounded-[20px] border border-[#E7E5EC] bg-white p-6 shadow-sm" data-testid="result">
      <div ref={textRef}>
        <h3 className="text-xl font-semibold" data-testid="text-title">{story.title}</h3>
        <p className="mt-3 whitespace-pre-wrap text-lg leading-relaxed" data-testid="text-story">{story.story}</p>
      </div>
      <p className="mt-3 text-sm text-[#5E6473]" data-testid="text-source">{story.source === "demo" ? "Demo story" : "AI-generated fiction"} · about 20–30 seconds to hear</p>
      {blocked && <p className="mt-2 text-sm font-medium" role="status">Your story is ready. Press Play to listen.</p>}
      {!supported && <p className="mt-2 text-sm text-[#5E6473]">This browser can't read aloud; the text is all yours.</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={onPlay} disabled={!supported} data-testid="button-play"><Play className="h-4 w-4" aria-hidden />{speaking ? "Replay" : "Play"}</button>
        <button type="button" className={btn} onClick={onStop} disabled={!speaking} data-testid="button-stop"><Square className="h-4 w-4" aria-hidden />Stop</button>
        <button type="button" className={btn} onClick={onNew} disabled={loading} data-testid="button-new"><RefreshCw className="h-4 w-4" aria-hidden />New story</button>
        <button type="button" className={btn} onClick={copy} data-testid="button-copy"><Copy className="h-4 w-4" aria-hidden />Copy text</button>
      </div>
      <p className="mt-2 text-sm text-[#5E6473]" role="status">{copied}</p>
    </article>
  );
}
