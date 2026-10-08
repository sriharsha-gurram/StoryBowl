// The one narration hook: queues a story sentence by sentence with the browser's own voices.
// It exists so components never touch speechSynthesis and stale callbacks are ignored.
import { useCallback, useEffect, useRef, useState } from "react";

const supported = typeof window !== "undefined" && "speechSynthesis" in window;

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const token = useRef(0);
  const startTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const queue = useRef<SpeechSynthesisUtterance[]>([]);

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const en = speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith("en"));
      voiceRef.current = en.find(v => v.localService && v.default) ?? en.find(v => v.localService) ?? en[0] ?? null;
    };
    load();
    speechSynthesis.addEventListener("voiceschanged", load);
    return () => { speechSynthesis.removeEventListener("voiceschanged", load); token.current++; clearTimeout(startTimer.current); queue.current = []; speechSynthesis.cancel(); };
  }, []);

  const stop = useCallback(() => {
    token.current++;
    clearTimeout(startTimer.current);
    queue.current = [];
    if (supported) speechSynthesis.cancel();
    setSpeaking(false);
    setBlocked(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!supported) return;
    speechSynthesis.cancel();
    clearTimeout(startTimer.current);
    const mine = ++token.current;
    setBlocked(false);
    setSpeaking(false);
    const en = speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith("en"));
    voiceRef.current = en.find(v => v.localService && v.default) ?? en.find(v => v.localService) ?? en[0] ?? null;
    if (!voiceRef.current) { setBlocked(true); return; }
    const parts = text.match(/[^.!?]+[.!?]*/g)?.map(p => p.trim()).filter(Boolean) ?? [text];
    queue.current = parts.map((part, i) => {
      const u = new SpeechSynthesisUtterance(part);
      u.lang = "en-US"; u.rate = 0.95; u.volume = 1;
      if (voiceRef.current) u.voice = voiceRef.current;
      if (i === 0) u.onstart = () => { if (token.current === mine) { clearTimeout(startTimer.current); setSpeaking(true); } };
      u.onend = () => { if (token.current === mine && i === parts.length - 1) setSpeaking(false); };
      u.onerror = (e) => {
        if (token.current !== mine) return;
        if (e.error === "interrupted" || e.error === "canceled") return;
        token.current++; clearTimeout(startTimer.current); setSpeaking(false); setBlocked(true);
        speechSynthesis.cancel();
      };
      return u;
    });
    // Some browsers silently refuse deferred autoplay instead of firing an error.
    startTimer.current = setTimeout(() => {
      if (token.current === mine) {
        token.current++; speechSynthesis.cancel(); setSpeaking(false); setBlocked(true);
      }
    }, 2500);
    try { queue.current.forEach(u => speechSynthesis.speak(u)); }
    catch { clearTimeout(startTimer.current); token.current++; speechSynthesis.cancel(); setSpeaking(false); setBlocked(true); }
  }, []);

  return { supported, speaking, blocked, speak, stop };
}
