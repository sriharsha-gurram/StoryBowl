// The whole toy on route "/": wires state, generation, speech, library and cancellation together.
// Generation uses plain async calls with AbortController and request ids, not query state.
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { RotateCcw, RotateCw, Play, Shuffle, Sparkles } from "lucide-react";
import { getStoryStatus, type Story } from "@workspace/api-client-react";
import { exampleIds, type Mood } from "@workspace/story-core";
import { ObjectShelf } from "@/components/object-shelf";
import { MoodPicker, StoryBowl } from "@/components/story-bowl";
import { StoryResult } from "@/components/story-result";
import { StoryLibrary } from "@/components/story-library";
import { StickyActionBar } from "@/components/sticky-action-bar";
import { WeavingStatus } from "@/components/weaving-status";
import { HowItWorks } from "@/components/how-it-works";
import { useSpeech } from "@/hooks/use-speech";
import { useStoryLibrary } from "@/hooks/use-story-library";
import { generateWithRetry, STORY_HICCUP } from "@/lib/generate-with-retry";
import { MAX, MIN, initialState, openingOf, reducer, surprise } from "@/lib/story-state";

export default function Home() {
  const [s, dispatch] = useReducer(reducer, initialState);
  const [demo, setDemo] = useState(false);
  const [retrying, setRetrying] = useState(0);
  const speech = useSpeech();
  const library = useStoryLibrary();
  const saveRef = useRef(library.save); saveRef.current = library.save;
  const ctrl = useRef<AbortController | null>(null);
  const reqRef = useRef(0);
  reqRef.current = s.requestId;

  useEffect(() => {
    const c = new AbortController();
    getStoryStatus({ signal: c.signal }).then(r => setDemo(r.demo)).catch(() => {
      if (!c.signal.aborted) dispatch({ type: "status-error", message: "The story service is not available right now. Please reload to reconnect." });
    });
    return () => c.abort();
  }, []);
  useEffect(() => () => ctrl.current?.abort(), []);
  useEffect(() => {
    const selector = s.phase === "loading" ? '[data-testid="text-loading"]'
      : s.phase === "ready" ? '[data-testid="result"]'
      : s.phase === "error" ? '[data-testid="text-error"]' : null;
    if (!selector) return;
    // A sticky-button click may happen far above the result on a phone.
    document.querySelector<HTMLElement>(selector)?.scrollIntoView?.({
      block: "start",
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [s.phase, s.requestId]);

  // Every state change that invalidates a story also stops speech and aborts the request.
  const cancel = useCallback(() => { ctrl.current?.abort(); ctrl.current = null; speech.stop(); }, [speech.stop]);
  const add = (id: string) => { if (!s.ids.includes(id) && s.ids.length < 10) cancel(); dispatch({ type: "add", id }); };
  const remove = (id: string) => { cancel(); dispatch({ type: "remove", id }); };
  const setIds = (ids: string[]) => { cancel(); dispatch({ type: "set", ids }); };
  const setMood = (mood: Mood) => { if (mood !== s.mood) cancel(); dispatch({ type: "mood", mood }); };
  const reset = () => { cancel(); dispatch({ type: "reset" }); };
  const open = (story: Story) => {
    cancel(); dispatch({ type: "open", story });
  };

  const make = async (ids?: string[]) => {
    if (ctrl.current) return; // synchronous double-submit guard
    speech.stop();
    const objectIds = ids ?? s.ids;
    if (objectIds.length < MIN) return;
    const id = s.requestId + 1;
    reqRef.current = id;
    const c = new AbortController(); ctrl.current = c;
    setRetrying(0);
    dispatch(ids ? { type: "start", ids } : { type: "start" });
    try {
      const story = await generateWithRetry(
        { objectIds, mood: s.mood, recentOpenings: s.history.map(h => openingOf(h.story)) },
        { signal: c.signal, onRetry: a => { if (!c.signal.aborted) setRetrying(a); } },
      );
      if (reqRef.current !== id || c.signal.aborted) return;
      dispatch({ type: "success", requestId: id, story });
      saveRef.current(story);
      speech.speak(story.story);
    } catch {
      if (c.signal.aborted || reqRef.current !== id) return;
      dispatch({ type: "failure", requestId: id, message: STORY_HICCUP });
    } finally {
      if (ctrl.current === c) ctrl.current = null;
    }
  };

  const need = MIN - s.ids.length;
  const loading = s.phase === "loading";
  const failed = s.phase === "error";
  const outline = "inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#9A9DA8] bg-white px-3 text-sm font-medium hover:bg-[#F6F3EA] disabled:opacity-50";
  const makeLabel = need > 0 ? `Add ${need} more object${need === 1 ? "" : "s"}` : "Make my story";
  const sticky = loading ? { kind: "make" as const, label: "Weaving your story…" }
    : failed ? { kind: "retry" as const, label: "Try again" }
    : s.result ? { kind: "new" as const, label: "New story" }
    : { kind: "make" as const, label: makeLabel };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#FAF8F3] pb-28 text-[#1E2230] lg:pb-0">
      <header className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 -rotate-6 place-items-center rounded-lg bg-[#3F5BE0] text-white" aria-hidden><Sparkles className="h-5 w-5" /></span>
          <span className="font-display text-xl font-bold">StoryBowl</span>
          <span className="hidden text-sm text-[#454A5A] md:inline">Ordinary things. Unexpected stories.</span>
        </div>
        <div className="flex gap-2">
          <HowItWorks />
          <button type="button" className={outline} onClick={reset} data-testid="button-reset" title="Clears the bowl. Your story shelf stays."><RotateCcw className="h-4 w-4" aria-hidden />Reset</button>
        </div>
      </header>
      {demo && <p className="mx-auto max-w-[1360px] px-4 pb-2 text-sm text-[#454A5A] sm:px-6" data-testid="banner-demo">Demo mode: prepared example stories</p>}
      <main className="mx-auto grid max-w-[1360px] gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
        <ObjectShelf ids={s.ids} query={s.query} category={s.category}
          onQuery={q => dispatch({ type: "query", query: q })} onCategory={c => dispatch({ type: "category", category: c })} onAdd={add} />
        <div className="min-w-0 space-y-6 lg:max-h-[calc(100dvh-132px)] lg:overflow-y-auto lg:pr-1">
          <section aria-labelledby="story-h" className="space-y-5 rounded-2xl border border-[#E8E4DA] bg-white p-5 shadow-[0_1px_2px_rgba(30,35,60,0.04)] sm:p-6">
            <div>
              <h2 id="story-h" className="font-display text-2xl font-bold">What happens when these meet?</h2>
              <p className="mt-1 text-sm text-[#454A5A]">Choose a few objects and a mood. Make a story.</p>
            </div>
            <StoryBowl ids={s.ids} notice={s.notice} onAdd={add} onRemove={remove} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className={outline} onClick={() => setIds(surprise())} disabled={loading} data-testid="button-surprise"><Shuffle className="h-4 w-4" aria-hidden />Surprise me</button>
              <button type="button" className={outline} onClick={() => make(exampleIds)} disabled={loading} data-testid="button-example"><Sparkles className="h-4 w-4" aria-hidden />Try the example</button>
            </div>
            <MoodPicker mood={s.mood} onChange={setMood} />
            <div className="flex flex-wrap items-center gap-4">
              {!s.result && !failed && (
                <button type="button" onClick={() => make()} disabled={need > 0 || loading} data-testid="button-make"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#3F5BE0] px-5 font-semibold text-white transition-transform hover:bg-[#344CC4] active:scale-[0.98] disabled:bg-[#ECE8DD] disabled:text-[#454A5A]">
                  <Play className="h-4 w-4" aria-hidden />{makeLabel}
                </button>
              )}
            </div>
            {loading && <WeavingStatus ids={s.ids} retrying={retrying} />}
            {s.error && (
              <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E9C77B] bg-[#FFF8E6] p-4 text-sm" data-testid="text-error">
                <p className="min-w-[200px] flex-1">{s.error}</p>
                {failed && (
                  <button type="button" onClick={() => make()} disabled={loading || need > 0} data-testid="button-retry"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#3F5BE0] px-4 font-semibold text-white hover:bg-[#344CC4]">
                    <RotateCw className="h-4 w-4" aria-hidden />Try again
                  </button>
                )}
              </div>
            )}
            {s.result && (
              <StoryResult story={s.result} loading={loading} speaking={speech.speaking} starting={speech.starting} blocked={speech.blocked}
                supported={speech.supported} noVoices={speech.noVoices} voiceMessage={speech.message}
                onPlay={() => speech.speak(s.result!.story)} onStop={speech.stop} onNew={() => make()} />
            )}
          </section>
          <StoryLibrary entries={library.entries} notice={library.notice} activeId={s.result?.id}
            onOpen={open} onFavorite={library.toggleFavorite} onRemove={library.remove} />
        </div>
      </main>
      <StickyActionBar count={s.ids.length} max={MAX} label={sticky.label} kind={sticky.kind} loading={loading}
        disabled={loading || need > 0} onAction={() => make()} />
    </div>
  );
}
