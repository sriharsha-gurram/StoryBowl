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
  const btn = "inline-flex items-center gap-1.5 rounded-lg border border-[#9A9DA8] bg-white px-3.5 py-2 text-sm font-medium hover:bg-[#F6F3EA] disabled:opacity-50";
  return (
    <article className="rounded-2xl border border-[#E8E4DA] bg-[#FFFDF8] p-6 sm:p-8" data-testid="result">
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <span className="rounded-full bg-[#EEF1FF] px-2.5 py-1 text-[#2A3FB0]" data-testid="text-source">{story.source === "demo" ? "Demo story" : "AI-generated fiction"}</span>
        <span className="rounded-full bg-[#FFF3DC] px-2.5 py-1 text-[#7A4B00]" data-testid="text-wordcount">{story.wordCount} words</span>
        <span className="rounded-full bg-[#EAF6F0] px-2.5 py-1 text-[#1D5B40]">about 45–70 seconds to hear</span>
      </div>
      <div ref={textRef} className="mx-auto mt-4 max-w-[62ch]">
        <h3 className="font-display text-3xl font-bold leading-tight" data-testid="text-title">{story.title}</h3>
        <p className="mt-4 whitespace-pre-wrap text-[1.075rem] leading-[1.75] text-[#2B3040]" data-testid="text-story">{story.story}</p>
      </div>
      {blocked && <p className="mt-3 text-sm font-medium" role="status">Your story is ready. Press Play to listen.</p>}
      {!supported && <p className="mt-3 text-sm text-[#454A5A]">This browser can't read aloud; the text is all yours.</p>}
      <div className="mt-6 flex flex-wrap gap-2 border-t border-[#EEEADF] pt-4">
        <button type="button" className={btn} onClick={onPlay} disabled={!supported} data-testid="button-play"><Play className="h-4 w-4" aria-hidden />{speaking ? "Replay" : "Play"}</button>
        <button type="button" className={btn} onClick={onStop} disabled={!speaking} data-testid="button-stop"><Square className="h-4 w-4" aria-hidden />Stop</button>
        <button type="button" className={btn} onClick={onNew} disabled={loading} data-testid="button-new"><RefreshCw className="h-4 w-4" aria-hidden />New story</button>
        <button type="button" className={btn} onClick={copy} data-testid="button-copy"><Copy className="h-4 w-4" aria-hidden />Copy text</button>
      </div>
      <p className="mt-2 text-sm text-[#454A5A]" role="status">{copied}</p>
    </article>
  );
}
