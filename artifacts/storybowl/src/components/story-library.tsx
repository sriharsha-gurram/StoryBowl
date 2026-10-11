// StoryLibrary: browse every saved story, star favorites, reopen or delete (with confirmation).
import { useState } from "react";
import { BookOpen, Star, Trash2 } from "lucide-react";
import type { Story } from "@workspace/api-client-react";
import type { LibraryEntry } from "@/hooks/use-story-library";

const moodDot: Record<string, string> = { calm: "bg-[#5FB38C]", funny: "bg-[#F2A93B]", mystery: "bg-[#6C78E6]" };
const when = (t: number) => new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

interface Props { entries: LibraryEntry[]; notice: string | null; activeId?: string; onOpen: (s: Story) => void; onFavorite: (id: string) => void; onRemove: (id: string) => void }

export function StoryLibrary({ entries, notice, activeId, onOpen, onFavorite, onRemove }: Props) {
  const [filter, setFilter] = useState<"all" | "fav">("all");
  const [confirm, setConfirm] = useState<string | null>(null);
  const shown = filter === "fav" ? entries.filter(e => e.favorite) : entries;
  const tab = (on: boolean) => `min-h-[44px] rounded-full border px-4 text-sm ${on ? "border-[#3F5BE0] bg-[#EEF1FF] font-semibold text-[#2A3FB0]" : "border-[#DDD8CB] bg-white text-[#454A5A] hover:bg-[#F6F3EA]"}`;
  return (
    <section aria-labelledby="lib-h" className="rounded-2xl border border-[#E8E4DA] bg-white p-5" data-testid="library">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="lib-h" className="font-display flex items-center gap-2 text-xl font-bold"><BookOpen className="h-5 w-5 text-[#3F5BE0]" aria-hidden />Your story shelf</h2>
        <div role="group" aria-label="Filter stories" className="flex gap-1.5">
          <button type="button" aria-pressed={filter === "all"} className={tab(filter === "all")} onClick={() => setFilter("all")} data-testid="button-library-all">All ({entries.length})</button>
          <button type="button" aria-pressed={filter === "fav"} className={tab(filter === "fav")} onClick={() => setFilter("fav")} data-testid="button-library-favorites">Starred ({entries.filter(e => e.favorite).length})</button>
        </div>
      </div>
      {notice && <p role="status" className="mt-3 rounded-lg border border-[#E9C77B] bg-[#FFF8E6] p-3 text-sm" data-testid="text-library-notice">{notice}</p>}
      {shown.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-[#DDD8CB] bg-[#FBFAF7] px-6 py-8 text-center" data-testid="text-library-empty">
          <p className="font-display text-lg font-semibold">{filter === "fav" ? "No starred stories yet" : "Your shelf is waiting"}</p>
          <p className="mt-1 text-sm text-[#5B6070]">{filter === "fav" ? "Tap the star on a story you want to keep close." : "Every story you make lands here automatically, right in this browser."}</p>
        </div>
      ) : (
        <ul className="mt-4 grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2">
          {shown.map(({ story, savedAt, favorite }) => (
            <li key={story.id} data-testid={`library-entry-${story.id}`}
              className={`flex min-w-0 items-stretch gap-1 rounded-xl border bg-[#FFFDF8] ${activeId === story.id ? "border-[#3F5BE0] ring-1 ring-[#3F5BE0]" : "border-[#EEEADF]"}`}>
              {confirm === story.id ? (
                <div className="flex flex-1 flex-wrap items-center gap-2 p-3" role="alertdialog" aria-label={`Delete ${story.title}?`}>
                  <span className="flex-1 text-sm">Delete “{story.title}” for good?</span>
                  <button type="button" className="min-h-[44px] rounded-lg bg-[#B3261E] px-3 text-sm font-semibold text-white" onClick={() => { onRemove(story.id); setConfirm(null); }} data-testid={`button-confirm-delete-${story.id}`}>Delete</button>
                  <button type="button" autoFocus className="min-h-[44px] rounded-lg border border-[#9A9DA8] bg-white px-3 text-sm" onClick={() => setConfirm(null)} data-testid={`button-cancel-delete-${story.id}`}>Keep</button>
                </div>
              ) : (<>
                <button type="button" onClick={() => onOpen(story)} data-testid={`button-open-${story.id}`} className="min-w-0 flex-1 rounded-l-xl p-3 text-left hover:bg-[#F6F3EA]">
                  <span className="flex items-center gap-2"><span className={`h-2 w-2 shrink-0 rounded-full ${moodDot[story.mood] ?? "bg-[#9A9DA8]"}`} aria-hidden /><span className="truncate font-semibold">{story.title}</span></span>
                  <span className="mt-0.5 block truncate text-xs capitalize text-[#5B6070]">{story.mood} · {story.objectIds.join(", ").replace(/-/g, " ")}</span>
                  <span className="block text-xs text-[#5B6070]">{when(savedAt)}</span>
                </button>
                <button type="button" aria-pressed={favorite} aria-label={favorite ? `Unstar ${story.title}` : `Star ${story.title}`} onClick={() => onFavorite(story.id)} data-testid={`button-favorite-${story.id}`}
                  className="grid h-11 w-11 shrink-0 place-items-center self-center rounded-lg hover:bg-[#FFF3DC]">
                  <Star className={`h-5 w-5 ${favorite ? "sb-pop fill-[#F2A93B] text-[#D18A1E]" : "text-[#9A9DA8]"}`} aria-hidden />
                </button>
                <button type="button" aria-label={`Delete ${story.title}`} onClick={() => setConfirm(story.id)} data-testid={`button-delete-${story.id}`}
                  className="mr-1 grid h-11 w-11 shrink-0 place-items-center self-center rounded-lg text-[#9A9DA8] hover:bg-[#FFF4F2] hover:text-[#B3261E]">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </>)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
