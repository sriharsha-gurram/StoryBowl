import { vi } from "vitest";

// Events are controlled by tests, not by the host OS or actual audio playback.
export class MockUtterance {
  constructor(public text: string) {}
  lang = "";
  rate = 1;
  volume = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
}

export const englishVoice = {
  name: "Deterministic local English",
  lang: "en-IN",
  default: true,
  localService: true,
  voiceURI: "test-only",
} satisfies SpeechSynthesisVoice;

export const utterances: MockUtterance[] = [];
export const speechMock = {
  getVoices: vi.fn(() => [englishVoice]),
  speak: vi.fn((utterance: MockUtterance) => {
    utterances.push(utterance);
    utterance.onstart?.();
  }),
  cancel: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

export function resetSpeech() {
  utterances.length = 0;
  speechMock.getVoices.mockReset().mockReturnValue([englishVoice]);
  speechMock.speak.mockReset().mockImplementation(utterance => {
    utterances.push(utterance);
    utterance.onstart?.();
  });
  speechMock.cancel.mockClear();
  speechMock.addEventListener.mockClear();
  speechMock.removeEventListener.mockClear();
}
