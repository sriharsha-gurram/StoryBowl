// The whole toy on route "/": wires state, generation, speech and cancellation together.
// Generation uses plain async calls with AbortController and request ids, not query state.
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Loader, Play, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import { generateStory, getStoryStatus } from "@workspace/api-client-react";
import { exampleIds, type Mood } from "@workspace/story-core";
import { ObjectShelf } from "@/components/object-shelf";
import { MoodPicker, StoryBowl } from "@/components/story-bowl";
import { StoryResult } from "@/components/story-result";
import { HowItWorks } from "@/components/how-it-works";
import { useSpeech } from "@/hooks/use-speech";
import { MIN, initialState, openingOf, reducer, surprise } from "@/lib/story-state";

export default function Home() {
  const [s, dispatch] = useReducer(reducer, initialState);
  const [demo, setDemo] = useState(false);
  const speech = useSpeech();
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

  // Every state change that invalidates a story also stops speech and aborts the request.
  const cancel = useCallback(() => { ctrl.current?.abort(); ctrl.current = null; speech.stop(); }, [speech.stop]);
  const add = (id: string) => { if (!s.ids.includes(id) && s.ids.length < 10) cancel(); dispatch({ type: "add", id }); };
  const remove = (id: string) => { cancel(); dispatch({ type: "remove", id }); };
  const setIds = (ids: string[]) => { cancel(); dispatch({ type: "set", ids }); };
  const setMood = (mood: Mood) => { if (mood !== s.mood) cancel(); dispatch({ type: "mood", mood }); };
  const reset = () => { cancel(); dispatch({ type: "reset" }); };

  const make = async () => {
    cancel();
    const id = s.requestId + 1;
    reqRef.current = id;
    const c = new AbortController(); ctrl.current = c;
    dispatch({ type: "start" });
    try {
      const story = await generateStory({ objectIds: s.ids, mood: s.mood, recentOpenings: s.history.map(h => openingOf(h.story)) }, { signal: c.signal });
      if (reqRef.current !== id || c.signal.aborted) return;
      dispatch({ type: "success", requestId: id, story });
      speech.speak(story.story);
    } catch (e) {
      if (c.signal.aborted || reqRef.current !== id) return;
      const data = (e as { data?: { message?: unknown } }).data;
      const message = typeof data?.message === "string" ? data.message : "Something went wrong. Please try again.";
      dispatch({ type: "failure", requestId: id, message });
    }
  };

  const need = MIN - s.ids.length;
  const loading = s.phase === "loading";
  const outline = "inline-flex items-center gap-1.5 rounded-lg border border-[#9A9DA8] bg-white px-3 py-2 text-sm font-medium hover:bg-[#F6F3EA]";

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#FAF8F3] text-[#1E2230]">
      <header className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#3F5BE0] text-white" aria-hidden><Sparkles className="h-5 w-5" /></span>
          <span className="font-display text-xl font-bold">StoryBowl</span>
          <span className="hidden text-sm text-[#454A5A] md:inline">Ordinary things. Unexpected stories.</span>
        </div>
        <div className="flex gap-2">
          <HowItWorks />
          <button type="button" className={outline} onClick={reset} data-testid="button-reset"><RotateCcw className="h-4 w-4" aria-hidden />Reset</button>
        </div>
      </header>
      {demo && <p className="mx-auto max-w-[1360px] px-6 pb-2 text-sm text-[#454A5A]" data-testid="banner-demo">Demo mode: prepared example stories</p>}
      <main className="mx-auto grid max-w-[1360px] gap-6 px-6 pb-10 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
        <ObjectShelf ids={s.ids} query={s.query} category={s.category}
          onQuery={q => dispatch({ type: "query", query: q })} onCategory={c => dispatch({ type: "category", category: c })} onAdd={add} />
        <section aria-labelledby="story-h" className="min-w-0 space-y-5 rounded-2xl border border-[#E8E4DA] bg-white p-6 shadow-[0_1px_2px_rgba(30,35,60,0.04)] lg:max-h-[calc(100dvh-132px)] lg:overflow-y-auto">
          <div>
            <h2 id="story-h" className="font-display text-2xl font-bold">What happens when these meet?</h2>
            <p className="mt-1 text-sm text-[#454A5A]">Choose a few objects and a mood. Make a story.</p>
          </div>
          <StoryBowl ids={s.ids} notice={s.notice} onAdd={add} onRemove={remove} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={outline} onClick={() => setIds(surprise())} data-testid="button-surprise"><Shuffle className="h-4 w-4" aria-hidden />Surprise me</button>
            <button type="button" className={outline} onClick={() => setIds(exampleIds)} data-testid="button-example"><Sparkles className="h-4 w-4" aria-hidden />Try the example</button>
          </div>
          <MoodPicker mood={s.mood} onChange={setMood} />
          <div className="flex flex-wrap items-center gap-4">
            {!s.result && (
              <button type="button" onClick={make} disabled={need > 0 || loading} data-testid="button-make"
                className="inline-flex items-center gap-2 rounded-lg bg-[#3F5BE0] px-5 py-2.5 font-semibold text-white hover:bg-[#344CC4] disabled:bg-[#ECE8DD] disabled:text-[#454A5A]">
                <Play className="h-4 w-4" aria-hidden />{need > 0 ? `Add ${need} more object${need === 1 ? "" : "s"}` : "Make my story"}
              </button>
            )}
            {loading && <span className="inline-flex items-center gap-2 text-sm" role="status" data-testid="text-loading"><Loader className="h-4 w-4 animate-spin" aria-hidden />Finding the thread…</span>}
          </div>
          {s.error && <p role="alert" className="rounded-lg border border-[#B3261E] bg-[#FFF4F2] p-3 text-sm" data-testid="text-error">{s.error}</p>}
          {s.result && (
            <StoryResult story={s.result} loading={loading} speaking={speech.speaking} blocked={speech.blocked} supported={speech.supported}
              onPlay={() => speech.speak(s.result!.story)} onStop={speech.stop} onNew={make} />
          )}
        </section>
      </main>
    </div>
  );
}
