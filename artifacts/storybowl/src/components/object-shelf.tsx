// ObjectShelf and ObjectTile: searchable, categorized grid of draggable objects.
// Lives apart from the drop surface so picking and arranging stay separate concerns.
import { Check, Search } from "lucide-react";
import { catalog, categories } from "@workspace/story-core";
import { iconMap } from "@/lib/icons";

export function ObjectTile({ id, label, picked, onAdd }: { id: string; label: string; picked: boolean; onAdd: (id: string) => void }) {
  const Icon = iconMap[id]!;
  return (
    <button type="button" draggable aria-pressed={picked} aria-label={picked ? `${label}, in your collection` : `Add ${label}`}
      data-testid={`tile-${id}`} onClick={() => onAdd(id)}
      onDragStart={e => { e.dataTransfer.setData("text/plain", id); e.dataTransfer.effectAllowed = "copy"; }}
      className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-1 py-3 text-xs capitalize transition-[transform,background-color,border-color] hover:-translate-y-0.5 active:scale-95 hover:border-[#B9C3F5] hover:bg-[#F3F5FF] ${picked ? "sb-pop border-[#3F5BE0] bg-[#EEF1FF] font-semibold text-[#2A3FB0]" : "border-[#E8E4DA] bg-white"}`}>
      <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden />
      <span className="max-w-full truncate px-1">{label}</span>
      {picked && <Check className="sb-pop absolute right-1.5 top-1.5 h-3.5 w-3.5 text-[#3F5BE0]" aria-hidden />}
    </button>
  );
}

interface Props { ids: string[]; query: string; category: string; onQuery: (q: string) => void; onCategory: (c: string) => void; onAdd: (id: string) => void }

export function ObjectShelf({ ids, query, category, onQuery, onCategory, onAdd }: Props) {
  const q = query.trim().toLowerCase();
  const shown = catalog.filter(o => (category === "All" || o.category === category) &&
    (!q || o.label.includes(q) || o.aliases.some(a => a.includes(q))));
  return (
    <section aria-labelledby="shelf-h" className="flex min-h-0 flex-col rounded-2xl border border-[#E8E4DA] bg-white p-5 shadow-[0_1px_2px_rgba(30,35,60,0.04)] lg:h-[calc(100dvh-132px)]">
      <div className="flex items-baseline justify-between">
        <h2 id="shelf-h" className="font-display text-xl font-bold">Pick your objects</h2>
        <span className="text-xs text-[#5B6070]">{shown.length} of {catalog.length}</span>
      </div>
      <label className="relative mt-3 block">
        <span className="sr-only">Search objects</span>
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6070]" aria-hidden />
        <input type="search" value={query} onChange={e => onQuery(e.target.value)} placeholder="Search objects" data-testid="input-search"
          className="w-full rounded-lg border border-[#9A9DA8] bg-[#FBFAF7] py-2 pl-9 pr-3 text-sm placeholder:text-[#6B7080]" />
      </label>
      <div role="group" aria-label="Categories" className="mt-3 flex flex-wrap gap-1.5">
        {["All", ...categories].map(c => (
          <button key={c} type="button" aria-pressed={category === c} onClick={() => onCategory(c)} data-testid={`chip-${c}`}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${category === c ? "border-[#3F5BE0] bg-[#EEF1FF] font-semibold text-[#2A3FB0]" : "border-[#DDD8CB] bg-white text-[#454A5A] hover:bg-[#F6F3EA]"}`}>
            {category === c && <Check className="mr-1 inline h-3 w-3" aria-hidden />}{c}
          </button>
        ))}
      </div>
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 max-lg:max-h-80">
        {shown.length === 0
          ? <p className="rounded-xl bg-[#FBFAF7] py-10 text-center text-sm text-[#5B6070]" data-testid="text-no-match">No objects match</p>
          : <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
              {shown.map(o => <ObjectTile key={o.id} id={o.id} label={o.label} picked={ids.includes(o.id)} onAdd={onAdd} />)}
            </div>}
      </div>
    </section>
  );
}
