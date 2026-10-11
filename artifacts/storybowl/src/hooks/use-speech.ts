// Narrates with browser voices and reports preparing, speaking, blocked, and missing voices.
// Cancellation tokens ensure old utterance events never affect a later narration.
import { useCallback, useEffect, useRef, useState } from "react";

type Status = "idle" | "starting" | "speaking" | "blocked" | "no-voices";
export function useSpeech() {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [status, setStatus] = useState<Status>("idle");
  const token = useRef(0);
  const startTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const queue = useRef<SpeechSynthesisUtterance[]>([]);

  useEffect(() => {
    if (!supported) return;
    const voicesChanged = () => {
      if (speechSynthesis.getVoices().some(v => v.lang.toLowerCase().startsWith("en"))) {
        setStatus(s => s === "no-voices" ? "idle" : s);
      }
    };
    speechSynthesis.addEventListener("voiceschanged", voicesChanged);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", voicesChanged);
      token.current++; clearTimeout(startTimer.current); queue.current = []; speechSynthesis.cancel();
    };
  }, [supported]);

  const stop = useCallback(() => {
    token.current++; clearTimeout(startTimer.current); queue.current = [];
    if (supported) speechSynthesis.cancel();
    setStatus("idle");
  }, [supported]);

  const speak = useCallback((text: string) => {
    if (!supported) return;
    speechSynthesis.cancel(); clearTimeout(startTimer.current); queue.current = [];
    const mine = ++token.current;
    const en = speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith("en"));
    const voice = en.find(v => v.localService && v.default) ?? en.find(v => v.localService) ?? en[0];
    if (!voice) { setStatus("no-voices"); return; }
    setStatus("starting");
    const parts = text.match(/[^.!?]+[.!?]+["'”’)]*|[^.!?]+$/gu)?.map(p => p.trim()).filter(Boolean) ?? [text];
    queue.current = parts.map((part, i) => {
      const utterance = new SpeechSynthesisUtterance(part);
      utterance.lang = voice.lang; utterance.voice = voice; utterance.rate = 0.95; utterance.volume = 1;
      utterance.onstart = () => {
        if (token.current === mine) { clearTimeout(startTimer.current); setStatus("speaking"); }
      };
      utterance.onend = () => {
        if (token.current === mine && i === parts.length - 1) {
          clearTimeout(startTimer.current); queue.current = []; setStatus("idle");
        }
      };
      utterance.onerror = e => {
        if (token.current !== mine) return;
        token.current++; clearTimeout(startTimer.current); queue.current = [];
        speechSynthesis.cancel();
        setStatus(["interrupted", "canceled"].includes(e.error) ? "idle" : "blocked");
      };
      return utterance;
    });
    startTimer.current = setTimeout(() => {
      if (token.current !== mine) return;
      token.current++; queue.current = []; speechSynthesis.cancel(); setStatus("blocked");
    }, 2500);
    try { queue.current.forEach(utterance => speechSynthesis.speak(utterance)); }
    catch {
      clearTimeout(startTimer.current); token.current++; queue.current = [];
      speechSynthesis.cancel(); setStatus("blocked");
    }
  }, [supported]);

  const message = !supported ? "This browser doesn't support narration. You can still read or share your story."
    : status === "no-voices" ? "No English narration voices are available on this device. You can still read or share your story."
    : status === "blocked" ? "Narration didn't start on this device. Press Play to try again, or enjoy reading your story."
    : status === "starting" ? "Preparing narration…"
    : status === "speaking" ? "Reading aloud…" : null;
  return { supported, speaking: status === "speaking", starting: status === "starting", blocked: status === "blocked",
    noVoices: status === "no-voices", message, speak, stop };
}
