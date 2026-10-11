// Mobile-only sticky bar: object count plus the one primary action, padded for the safe area.
import { Loader, Play, RefreshCw, RotateCw } from "lucide-react";

interface Props { count: number; max: number; label: string; kind: "make" | "new" | "retry"; loading: boolean; disabled: boolean; onAction: () => void }

export function StickyActionBar({ count, max, label, kind, loading, disabled, onAction }: Props) {
  const Icon = loading ? Loader : kind === "new" ? RefreshCw : kind === "retry" ? RotateCw : Play;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E8E4DA] bg-[#FAF8F3]/95 px-4 pt-3 backdrop-blur lg:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }} data-testid="sticky-bar">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <span className="text-sm font-medium text-[#454A5A]" data-testid="text-sticky-count">{count} of {max}</span>
        <button type="button" onClick={onAction} disabled={disabled} data-testid="button-sticky-action"
          className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#3F5BE0] px-4 font-semibold text-white active:scale-[0.98] disabled:bg-[#ECE8DD] disabled:text-[#454A5A]">
          <Icon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />{label}
        </button>
      </div>
    </div>
  );
}
