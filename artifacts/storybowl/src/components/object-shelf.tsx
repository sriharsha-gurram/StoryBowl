// ObjectShelf and ObjectTile: searchable, categorized grid of draggable ingredients.
// Lives apart from the bowl so picking and arranging stay separate concerns.
import { Check, Search } from "lucide-react";
import { catalog, categories } from "@workspace/story-core";
import { iconMap } from "@/lib/icons";

export function ObjectTile({ id, label, picked, onAdd }: { id: string; label: string; picked: boolean; onAdd: (id: string) => void }) {
  const Icon = iconMap[id]!;
  return (
    <button type="button" draggable aria-pressed={picked} aria-label={picked ? `${label}, in the bowl` : `Add ${label}`}
      data-testid={`tile-${id}`} onClick={() => onAdd(id)}
      onDragStart={e => { e.dataTransfer.setData("text/plain", id); e.dataTransfer.effectAllowed = "copy"; }}
      className={`relative flex flex-col items-center gap-1 rounded-2xl border px-1 py-3 text-xs capitalize transition-colors hover:bg-[#F0EDFF] ${picked ? "border-[#5B4BDB] bg-[#F0EDFF]" : "border-[#C9C6D4] bg-white"}`}>
      <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden />
      <span>{label}</span>
      {picked && <Check className="absolute right-1 top-1 h-3.5 w-3.5 text-[#5B4BDB]" aria-hidden />}
    </button>
  );
}

interface Props { ids: string[]; query: string; category: string; onQuery: (q: string) => void; onCategory: (c: string) => void; onAdd: (id: string) => void }

export function ObjectShelf({ ids, query, category, onQuery, onCategory, onAdd }: Props) {
  const q = query.trim().toLowerCase();
  const shown = catalog.filter(o => (category === "All" || o.category === category) &&
    (!q || o.label.includes(q) || o.aliases.some(a => a.includes(q))));
  return (
    <section aria-labelledby="shelf-h" className="flex min-h-0 flex-col rounded-[20px] border border-[#E7E5EC] bg-white p-5 shadow-sm lg:h-[calc(100dvh-140px)]">
      <h2 id="shelf-h" className="text-lg font-semibold">Pick your ingredients</h2>
      <label className="relative mt-3 block">
        <span className="sr-only">Search objects</span>
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5E6473]" aria-hidden />
        <input type="search" value={query} onChange={e => onQuery(e.target.value)} placeholder="Search objects" data-testid="input-search"
          className="w-full rounded-xl border border-[#9A97A8] bg-white py-2 pl-9 pr-3 text-sm" />
      </label>
      <div role="group" aria-label="Categories" className="mt-3 flex flex-wrap gap-1.5">
        {["All", ...categories].map(c => (
          <button key={c} type="button" aria-pressed={category === c} onClick={() => onCategory(c)} data-testid={`chip-${c}`}
            className={`rounded-full border px-2.5 py-1 text-xs ${category === c ? "border-[#5B4BDB] bg-[#F0EDFF] font-semibold" : "border-[#C9C6D4]"}`}>
            {category === c && <Check className="mr-1 inline h-3 w-3" aria-hidden />}{c}
          </button>
        ))}
      </div>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto max-lg:max-h-80">
        {shown.length === 0
          ? <p className="py-8 text-center text-sm text-[#5E6473]" data-testid="text-no-match">No objects match</p>
          : <div className="grid grid-cols-3 gap-2 xl:grid-cols-4">
              {shown.map(o => <ObjectTile key={o.id} id={o.id} label={o.label} picked={ids.includes(o.id)} onAdd={onAdd} />)}
            </div>}
      </div>
    </section>
  );
}
