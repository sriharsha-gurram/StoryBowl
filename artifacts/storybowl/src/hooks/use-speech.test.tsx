import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSpeech } from "./use-speech";
import { englishVoice, speechMock, utterances } from "../test/speech-mock";

describe("browser narration with deterministic synthesis", () => {
  it("queues sentences with a local English voice and ignores stale end/error callbacks after stop", () => {
    const { result } = renderHook(useSpeech);
    act(() => result.current.speak("First sentence. Second sentence!"));
    expect(utterances.map(u => u.text)).toEqual(["First sentence.", "Second sentence!"]);
    expect(utterances.every(u => u.voice === englishVoice && u.rate === 0.95)).toBe(true);
    expect(result.current.speaking).toBe(true);
    const old = [...utterances];
    act(() => result.current.stop());
    act(() => result.current.speak("New narration."));
    act(() => {
      old[0]!.onstart?.();
      old[1]!.onend?.();
      old[1]!.onerror?.({ error: "not-allowed" });
    });
    expect(result.current.speaking).toBe(true);
    expect(result.current.blocked).toBe(false);
    act(() => utterances.at(-1)!.onend?.());
    expect(result.current.speaking).toBe(false);
  });

  it("keeps text usable when no English voice is available", () => {
    speechMock.getVoices.mockReturnValue([]);
    const { result } = renderHook(useSpeech);
    act(() => result.current.speak("A story."));
    expect(result.current.blocked).toBe(true);
    expect(result.current.speaking).toBe(false);
    expect(speechMock.speak).not.toHaveBeenCalled();
  });

  it("detects silent autoplay refusal and lets Play retry", () => {
    vi.useFakeTimers();
    speechMock.speak.mockImplementation(u => { utterances.push(u); });
    const { result } = renderHook(useSpeech);
    act(() => result.current.speak("A story."));
    act(() => vi.advanceTimersByTime(2500));
    expect(result.current.blocked).toBe(true);
    expect(result.current.speaking).toBe(false);
    act(() => utterances[0]!.onstart?.());
    expect(result.current.speaking).toBe(false);
    speechMock.speak.mockImplementation(u => { utterances.push(u); u.onstart?.(); });
    act(() => result.current.speak("A story."));
    expect(result.current.blocked).toBe(false);
    expect(result.current.speaking).toBe(true);
    act(() => vi.advanceTimersByTime(2500));
    expect(result.current.speaking).toBe(true);
  });

  it("cancels the start timeout on stop and handles narration errors", () => {
    vi.useFakeTimers();
    speechMock.speak.mockImplementation(u => { utterances.push(u); });
    const { result } = renderHook(useSpeech);
    act(() => result.current.speak("A story."));
    act(() => result.current.stop());
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.blocked).toBe(false);
    act(() => result.current.speak("Another story."));
    act(() => utterances.at(-1)!.onerror?.({ error: "not-allowed" }));
    expect(result.current.blocked).toBe(true);
    expect(result.current.speaking).toBe(false);
    expect(speechMock.cancel).toHaveBeenCalled();
  });
});
