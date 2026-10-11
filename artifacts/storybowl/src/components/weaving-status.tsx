// WeavingStatus: playful loading card that hops across the chosen objects while the story is made.
import { catalog } from "@workspace/story-core";
import { iconMap } from "@/lib/icons";

export function WeavingStatus({ ids, retrying }: { ids: string[]; retrying: number }) {
  return (
    <div role="status" data-testid="text-loading" className="rounded-xl border border-[#DDE2F8] bg-[#F5F7FF] p-4">
      <div className="flex items-center gap-2" aria-hidden>
        {ids.slice(0, 6).map((id, i) => {
          const Icon = iconMap[id];
          return Icon ? <span key={id} className="sb-hop grid h-9 w-9 place-items-center rounded-lg bg-white text-[#2A3FB0] shadow-sm" style={{ animationDelay: `${i * 140}ms` }}><Icon className="h-5 w-5" strokeWidth={1.5} /></span> : null;
        })}
      </div>
      <p className="mt-3 font-display text-lg font-semibold">Weaving your story…</p>
      <p className="text-sm text-[#454A5A]">
        {retrying > 0 ? "Still at it, the storyteller is taking another pass." : `Tying together ${ids.map(id => catalog.find(c => c.id === id)?.label ?? id).slice(0, 3).join(", ")}${ids.length > 3 ? " and friends" : ""}.`}
      </p>
      <div className="mt-3 space-y-2" aria-hidden>
        <div className="sb-shimmer h-2.5 w-11/12 rounded-full bg-[#E3E7FA]" />
        <div className="sb-shimmer h-2.5 w-4/5 rounded-full bg-[#E3E7FA]" />
        <div className="sb-shimmer h-2.5 w-2/3 rounded-full bg-[#E3E7FA]" />
      </div>
    </div>
  );
}
