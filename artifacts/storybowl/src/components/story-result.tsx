// StoryResult: the finished story, mood-tinted, with narration, new story, copy and share.
import { useRef, useState } from "react";
import { Copy, Play, RefreshCw, Share2, Square } from "lucide-react";
import type { Story } from "@workspace/api-client-react";
import { shareStory } from "@/lib/share-story";

interface Props {
  story: Story; loading: boolean; speaking: boolean; starting: boolean; blocked: boolean; supported: boolean;
  noVoices: boolean; voiceMessage: string | null; onPlay: () => void; onStop: () => void; onNew: () => void;
}
const tint: Record<string, string> = {
  calm: "bg-[#F1F9F4] border-[#CFE8DA]", funny: "bg-[#FFF8EA] border-[#F3DDB0]", mystery: "bg-[#F3F4FF] border-[#D6DAF7]",
};

export function StoryResult({ story, loading, speaking, starting, blocked, supported, noVoices, voiceMessage, onPlay, onStop, onNew }: Props) {
  const [copied, setCopied] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [manual, setManual] = useState<string | null>(null);
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
  const share = async () => {
    setManual(null); setShareMsg("");
    try {
      const r = await shareStory({ title: story.title, story: story.story });
      if (r.kind === "shared") setShareMsg("Shared.");
      else if (r.kind === "copied") setShareMsg("Story and link copied to your clipboard.");
      else if (r.kind === "cancelled") setShareMsg("");
      else { setManual(r.text ?? `${story.title}\n\n${story.story}\n\n${window.location.href}`); setShareMsg("Copy the text below to share it."); }
    } catch {
      setManual(`${story.title}\n\n${story.story}\n\n${window.location.href}`); setShareMsg("Copy the text below to share it.");
    }
  };
  const paragraphs = story.story.split(/\n\s*\n/).filter(p => p.trim());
  const btn = "inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#9A9DA8] bg-white px-3.5 text-sm font-medium hover:bg-[#F6F3EA] disabled:opacity-50";
  return (
    <article key={story.id} className={`sb-reveal rounded-2xl border p-5 sm:p-8 ${tint[story.mood] ?? "bg-[#FFFDF8] border-[#E8E4DA]"}`} data-testid="result">
      <p className="text-xs text-[#5B6070]" data-testid="text-source">{story.source === "demo" ? "Demo story" : "AI-generated fiction"}</p>
      <div ref={textRef} className="mx-auto mt-3 max-w-[62ch]">
        <h3 className="font-display text-2xl font-bold leading-tight sm:text-3xl" data-testid="text-title">{story.title}</h3>
        <div className="mt-4 space-y-4 text-[1.075rem] leading-[1.75] text-[#2B3040]" data-testid="text-story">
          {paragraphs.map((p, i) => <p key={i} className="sb-reveal-line" style={{ animationDelay: `${120 + i * 110}ms` }}>{p}</p>)}
        </div>
      </div>
      <div className="mx-auto mt-4 max-w-[62ch] space-y-1 text-sm" aria-live="polite">
        {starting && <p className="font-medium text-[#2A3FB0]" data-testid="text-narration">Preparing narration…</p>}
        {speaking && !starting && <p className="font-medium text-[#2A3FB0]" data-testid="text-narration">Reading aloud</p>}
        {voiceMessage && !speaking && !starting && <p className="text-[#454A5A]" data-testid={noVoices ? "text-voice-note" : "text-voice-message"}>{voiceMessage}</p>}
      </div>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-black/5 pt-4">
        <button type="button" className={btn} onClick={onPlay} disabled={!supported || starting} data-testid="button-play"><Play className="h-4 w-4" aria-hidden />{starting ? "Preparing…" : speaking ? "Replay" : "Play"}</button>
        <button type="button" className={btn} onClick={onStop} disabled={!(speaking || starting)} data-testid="button-stop"><Square className="h-4 w-4" aria-hidden />Stop</button>
        <button type="button" className={btn} onClick={onNew} disabled={loading} data-testid="button-new"><RefreshCw className="h-4 w-4" aria-hidden />New story</button>
        <button type="button" className={btn} onClick={copy} data-testid="button-copy"><Copy className="h-4 w-4" aria-hidden />Copy text</button>
        <button type="button" className={btn} onClick={share} data-testid="button-share"><Share2 className="h-4 w-4" aria-hidden />Share</button>
      </div>
      <p className="mt-2 text-sm text-[#454A5A]" role="status">{copied}</p>
      <p className="text-sm text-[#454A5A]" role="status" data-testid="text-share-status">{shareMsg}</p>
      {manual && (
        <label className="mt-2 block text-sm">
          <span className="sr-only">Story text to share</span>
          <textarea readOnly value={manual} rows={6} onFocus={e => e.currentTarget.select()} data-testid="textarea-share"
            className="mt-1 w-full rounded-lg border border-[#9A9DA8] bg-white p-3 text-sm" />
        </label>
      )}
    </article>
  );
}
