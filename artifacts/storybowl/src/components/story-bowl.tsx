// StoryBowl and MoodPicker: the drop stage with snapped slots plus mood radios.
// Together they are the "assembly" half of the toy, before any story exists.
import { X } from "lucide-react";
import { catalog, type Mood } from "@workspace/story-core";
import { iconMap } from "@/lib/icons";
import { MAX } from "@/lib/story-state";

export function StoryBowl({ ids, notice, onAdd, onRemove }: { ids: string[]; notice: string | null; onAdd: (id: string) => void; onRemove: (id: string) => void }) {
  return (
    <div>
      <div data-testid="stage" onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (catalog.some(o => o.id === id)) onAdd(id); }}
        className="relative mx-auto h-[300px] w-full max-w-[640px]">
        <div className="absolute inset-0 rounded-[50%] border-2 border-[#C9C6D4] bg-[#FAF9F6]" aria-hidden />
        {ids.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center px-24 text-center text-[#5E6473]" data-testid="text-empty">Drag in 3–10 objects, or click them to add.</p>
        )}
        <ul className="absolute inset-x-[9%] inset-y-[14%] grid grid-cols-5 grid-rows-2 gap-1" aria-label="Ingredients in the bowl">
          {ids.map(id => {
            const o = catalog.find(c => c.id === id)!; const Icon = iconMap[id]!;
            return (
              <li key={id} className="relative flex flex-col items-center justify-center rounded-xl bg-white/80 text-xs capitalize" data-testid={`slot-${id}`}>
                <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden /><span>{o.label}</span>
                <button type="button" aria-label={`Remove ${o.label}`} onClick={() => onRemove(id)} data-testid={`remove-${id}`}
                  className="absolute -right-1 -top-1 rounded-full border border-[#9A97A8] bg-white p-0.5"><X className="h-3 w-3" aria-hidden /></button>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mt-2 text-center text-sm text-[#5E6473]" aria-live="polite" data-testid="text-count">
        {notice ?? `${ids.length} of ${MAX} ingredients`}
      </p>
    </div>
  );
}

const moods: { id: Mood; name: string; blurb: string }[] = [
  { id: "calm", name: "Calm", blurb: "A gentle little escape" },
  { id: "funny", name: "Funny", blurb: "A small unexpected laugh" },
  { id: "mystery", name: "Mystery", blurb: "A curious turn of events" },
];

export function MoodPicker({ mood, onChange }: { mood: Mood; onChange: (m: Mood) => void }) {
  return (
    <div role="radiogroup" aria-label="Mood" className="grid gap-3 sm:grid-cols-3">
      {moods.map(m => (
        <label key={m.id} className={`cursor-pointer rounded-2xl border p-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-[#5B4BDB] ${mood === m.id ? "border-[#5B4BDB] bg-[#F0EDFF]" : "border-[#C9C6D4] bg-white"}`}>
          <input type="radio" name="mood" className="sr-only" checked={mood === m.id} onChange={() => onChange(m.id)} data-testid={`radio-${m.id}`} />
          <span className="block font-semibold">{mood === m.id ? "✓ " : ""}{m.name}</span>
          <span className="block text-sm text-[#5E6473]">{m.blurb}</span>
        </label>
      ))}
    </div>
  );
}
