// HowItWorks: three-step popover plus the short About/Privacy note.
// Uses the existing Radix popover so focus handling and Escape come for free.
import { CircleHelp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function HowItWorks() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" data-testid="button-how" className="inline-flex items-center gap-1.5 rounded-lg border border-[#9A9DA8] bg-white px-3 py-2 text-sm font-medium hover:bg-[#F6F3EA]">
          <CircleHelp className="h-4 w-4" aria-hidden />How it works
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-xl text-sm">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Pick 3–10 everyday objects by clicking or dragging them onto the drop surface.</li>
          <li>Choose a mood: Calm, Funny or Mystery.</li>
          <li>Press Make my story, then listen or read along.</li>
        </ol>
        <p className="mt-3 border-t border-[#E8E4DA] pt-3 text-[#454A5A]">
          About and privacy: in live mode the selected object names and generated stories are sent to the configured AI provider. Speech uses your device's own voices.
        </p>
      </PopoverContent>
    </Popover>
  );
}
