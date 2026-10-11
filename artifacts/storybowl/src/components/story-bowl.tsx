// StoryBowl and MoodPicker: the rectangular drop surface with snapped slots plus mood radios.
// Together they are the "assembly" half of the toy, before any story exists.
import { X } from "lucide-react";
import { catalog, type Mood } from "@workspace/story-core";
import { iconMap } from "@/lib/icons";
import { MAX, MIN } from "@/lib/story-state";

export function StoryBowl({ ids, notice, onAdd, onRemove }: { ids: string[]; notice: string | null; onAdd: (id: string) => void; onRemove: (id: string) => void }) {
  const ready = ids.length >= MIN;
  return (
    <div>
      <div data-testid="stage" onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (catalog.some(o => o.id === id)) onAdd(id); }}
        className="relative min-h-[210px] w-full rounded-2xl border-2 border-dashed border-[#C5CBEF] bg-[#F5F7FF] p-4">
        {ids.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-[#454A5A]" data-testid="text-empty">Drag in 3–10 objects, or click them to add.</p>
        )}
        <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-5" aria-label="Objects in your collection">
          {ids.map(id => {
            const o = catalog.find(c => c.id === id)!; const Icon = iconMap[id]!;
            return (
              <li key={id} className="sb-pop relative flex h-[96px] flex-col items-center justify-end gap-1 rounded-xl pb-2.5 border border-[#DDE2F8] bg-white text-xs capitalize shadow-[0_1px_2px_rgba(30,35,60,0.06)]" data-testid={`slot-${id}`}>
                <Icon className="h-6 w-6 shrink-0 text-[#2A3FB0]" strokeWidth={1.5} aria-hidden /><span className="max-w-full truncate px-1">{o.label}</span>
                <button type="button" aria-label={`Remove ${o.label}`} onClick={() => onRemove(id)} data-testid={`remove-${id}`}
                  className="group absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-xl"><span className="grid h-6 w-6 place-items-center rounded-full border border-[#9A9DA8] bg-white group-hover:bg-[#F6F3EA]"><X className="h-3.5 w-3.5" aria-hidden /></span></button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-2.5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ECE8DD]" aria-hidden>
          <div className={`h-full origin-left rounded-full transition-transform ${ready ? "bg-[#3F5BE0]" : "bg-[#F2A93B]"}`} style={{ transform: `scaleX(${ids.length / MAX})`, width: "100%" }} />
        </div>
        <p className="text-sm font-medium text-[#454A5A]" aria-live="polite" data-testid="text-count">
          {notice ?? `${ids.length} of ${MAX} objects`}
        </p>
      </div>
    </div>
  );
}

const moods: { id: Mood; name: string; blurb: string; tint: string }[] = [
  { id: "calm", name: "Calm", blurb: "A gentle little escape", tint: "bg-[#EAF6F0]" },
  { id: "funny", name: "Funny", blurb: "A small unexpected laugh", tint: "bg-[#FFF3DC]" },
  { id: "mystery", name: "Mystery", blurb: "A curious turn of events", tint: "bg-[#EEF0FF]" },
];

export function MoodPicker({ mood, onChange }: { mood: Mood; onChange: (m: Mood) => void }) {
  return (
    <div role="radiogroup" aria-label="Mood" className="grid gap-3 sm:grid-cols-3">
      {moods.map(m => (
        <label key={m.id} className={`cursor-pointer rounded-xl border p-3.5 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-[#3F5BE0] ${m.tint} ${mood === m.id ? "border-[#3F5BE0] ring-1 ring-[#3F5BE0]" : "border-transparent hover:border-[#C9C4B4]"}`}>
          <input type="radio" name="mood" className="sr-only" checked={mood === m.id} onChange={() => onChange(m.id)} data-testid={`radio-${m.id}`} />
          <span className="block font-semibold">{mood === m.id ? "Selected: " : ""}{m.name}</span>
          <span className="block text-sm text-[#454A5A]">{m.blurb}</span>
        </label>
      ))}
    </div>
  );
}
