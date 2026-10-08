import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateStory, getStoryStatus, type Story } from "@workspace/api-client-react";
import { catalog, exampleIds, fixtures, words } from "@workspace/story-core";
import Home from "./home";
import { speechMock, utterances } from "../test/speech-mock";

vi.mock("@workspace/api-client-react", () => ({
  generateStory: vi.fn(),
  getStoryStatus: vi.fn(),
}));

const generate = vi.mocked(generateStory);
const status = vi.mocked(getStoryStatus);
const prepared: Story = {
  ...fixtures.calm,
  id: "deterministic-story",
  objectIds: [...exampleIds],
  mood: "calm",
  language: "en",
  source: "ai",
  wordCount: words(fixtures.calm.story).length,
};
const nextStory: Story = {
  ...prepared, ...fixtures.funny, id: "next-story",
  wordCount: words(fixtures.funny.story).length,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

async function openHome() {
  const user = userEvent.setup();
  const view = render(<Home />);
  // Flush the mocked status request before beginning the interaction.
  await act(async () => {});
  return { user, ...view };
}

function collection() {
  return screen.getByRole("list", { name: "Objects in your collection" });
}

function collectedIds() {
  return within(collection()).queryAllByRole("listitem")
    .map(element => element.getAttribute("data-testid")!.replace("slot-", ""));
}

async function startExample(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Try the example" }));
  await user.click(screen.getByRole("button", { name: "Make my story" }));
}

// A small DataTransfer substitute exercises both the tile's dragStart handler
// and the tray's drop handler in jsdom; it does not pretend to test browser layout.
function dragToTray(id: string) {
  const data = new Map<string, string>();
  const dataTransfer = {
    effectAllowed: "",
    setData: vi.fn((type: string, value: string) => data.set(type, value)),
    getData: vi.fn((type: string) => data.get(type) ?? ""),
  };
  fireEvent.dragStart(screen.getByTestId(`tile-${id}`), { dataTransfer });
  expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", id);
  expect(dataTransfer.effectAllowed).toBe("copy");
  const stage = screen.getByTestId("stage");
  expect(fireEvent.dragOver(stage, { dataTransfer })).toBe(false);
  expect(fireEvent.drop(stage, { dataTransfer })).toBe(false);
}

beforeEach(() => {
  generate.mockReset().mockResolvedValue(prepared);
  status.mockReset().mockResolvedValue({ demo: false });
});

describe("composed object selection", () => {
  it("adds by click, Enter, Space, and drag/drop; unlocks generation at three", async () => {
    const { user } = await openHome();
    expect(screen.getByRole("button", { name: "Add 3 more objects" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Add cat" }));
    expect(screen.getByRole("button", { name: "Add 2 more objects" })).toBeDisabled();
    // Tab from the cat tile to the next catalog tile: bird.
    await user.tab();
    expect(screen.getByRole("button", { name: "Add bird" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Add 1 more object" })).toBeDisabled();
    await user.tab();
    expect(screen.getByRole("button", { name: "Add fish" })).toHaveFocus();
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Make my story" })).toBeEnabled();
    dragToTray("lamp");
    expect(collectedIds()).toEqual(["cat", "bird", "fish", "lamp"]);
    expect(screen.getByTestId("tile-lamp")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("text-count")).toHaveTextContent("4 of 10 objects");
    expect(generate).not.toHaveBeenCalled();
  });

  it("ignores duplicate click/drop and unknown drops, and caps either selection path at ten", async () => {
    const { user } = await openHome();
    const ids = catalog.slice(0, 10).map(o => o.id);
    await user.click(screen.getByTestId(`tile-${ids[0]}`));
    await user.click(screen.getByTestId(`tile-${ids[0]}`));
    dragToTray(ids[0]!);
    fireEvent.drop(screen.getByTestId("stage"), { dataTransfer: { getData: () => "not-an-object" } });
    expect(collectedIds()).toEqual([ids[0]]);
    for (const id of ids.slice(1, 9)) await user.click(screen.getByTestId(`tile-${id}`));
    dragToTray(ids[9]!);
    const extra = catalog[10]!.id;
    await user.click(screen.getByTestId(`tile-${extra}`));
    dragToTray(extra);
    expect(collectedIds()).toEqual(ids);
    expect(screen.getByTestId("tile-" + extra)).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("text-count")).toHaveTextContent("full (10 of 10 objects)");
    await user.click(screen.getByTestId(`remove-${ids[0]}`));
    expect(screen.getByTestId("text-count")).toHaveTextContent("9 of 10 objects");
    await user.click(screen.getByTestId(`tile-${extra}`));
    expect(collectedIds()).toEqual([...ids.slice(1), extra]);
  });

  it("filters labels, aliases, and categories without losing selection, and changes mood", async () => {
    const { user } = await openHome();
    await user.click(screen.getByRole("button", { name: "Add cat" }));
    const search = screen.getByRole("searchbox", { name: "Search objects" });
    await user.type(search, "  KITTEN  ");
    expect(screen.getByTestId("tile-cat")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByTestId(/^tile-/)).toHaveLength(1);
    await user.clear(search);
    await user.type(search, "lamp");
    expect(screen.getByRole("button", { name: "Add lamp" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Animals" }));
    expect(screen.getByText("No objects match")).toBeInTheDocument();
    await user.clear(search);
    expect(screen.getAllByTestId(/^tile-/)).toHaveLength(catalog.filter(o => o.category === "Animals").length);
    expect(screen.queryByTestId("tile-lamp")).not.toBeInTheDocument();
    expect(collectedIds()).toEqual(["cat"]);
    await user.click(screen.getByRole("button", { name: "Remove cat" }));
    expect(screen.getByTestId("tile-cat")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("text-empty")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Funny/ }));
    expect(screen.getByRole("radio", { name: /Funny/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Calm/ })).not.toBeChecked();
    await startExample(user);
    expect(generate).toHaveBeenCalledWith(
      { objectIds: exampleIds, mood: "funny", recentOpenings: [] },
      { signal: expect.any(AbortSignal) },
    );
  });
});

describe("generation and narration", () => {
  it("renders a 100–150-word story; Replay/Stop/Play never generate; New story retains objects", async () => {
    generate.mockResolvedValueOnce(prepared);
    const { user } = await openHome();
    expect(screen.queryByText(/Indian|India\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/English|100–150|45–70/)).not.toBeInTheDocument();
    await startExample(user);
    expect(await screen.findByTestId("text-title")).toHaveTextContent(prepared.title);
    expect(screen.getByTestId("text-story").textContent).toBe(prepared.story);
    const count = words(screen.getByTestId("text-story").textContent!).length;
    expect(count).toBeGreaterThanOrEqual(100);
    expect(count).toBeLessThanOrEqual(150);
    expect(screen.queryByTestId("text-wordcount")).not.toBeInTheDocument();
    expect(screen.queryByText(/seconds to hear/)).not.toBeInTheDocument();
    expect(screen.getByTestId("text-source")).toHaveTextContent("AI-generated fiction");
    expect(screen.queryByTestId("button-make")).not.toBeInTheDocument();
    expect(generate).toHaveBeenCalledTimes(1);
    expect(utterances.map(u => u.text).join(" ")).toBe(prepared.story);
    const oldUtterances = [...utterances];
    const queued = speechMock.speak.mock.calls.length;
    await user.click(screen.getByRole("button", { name: "Replay" }));
    expect(speechMock.speak).toHaveBeenCalledTimes(queued * 2);
    expect(utterances.slice(queued).map(u => u.text).join(" ")).toBe(prepared.story);
    // A canceled narration's callback cannot stop the current replay.
    act(() => oldUtterances.at(-1)!.onend?.());
    expect(screen.getByRole("button", { name: "Replay" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Stop" }));
    expect(screen.getByRole("button", { name: "Stop" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(generate).toHaveBeenCalledTimes(1);
    act(() => utterances.at(-1)!.onend?.());
    expect(screen.getByRole("button", { name: "Play" })).toBeEnabled();
    const pending = deferred<Story>();
    generate.mockReturnValueOnce(pending.promise);
    await user.click(screen.getByRole("button", { name: "New story" }));
    expect(screen.getByRole("button", { name: "New story" })).toBeDisabled();
    expect(collectedIds()).toEqual(exampleIds);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate).toHaveBeenNthCalledWith(
      2,
      { objectIds: exampleIds, mood: "calm", recentOpenings: [prepared.story.match(/^[^.!?]*[.!?]?/)![0]] },
      { signal: expect.any(AbortSignal) },
    );
    await act(async () => pending.resolve(nextStory));
    expect(screen.getByTestId("text-title")).toHaveTextContent(nextStory.title);
    expect(screen.getByTestId("text-story").textContent).toBe(nextStory.story);
    expect(collectedIds()).toEqual(exampleIds);
    await user.click(screen.getByRole("radio", { name: /Mystery/ }));
    expect(screen.queryByTestId("result")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make my story" })).toBeEnabled();
    expect(collectedIds()).toEqual(exampleIds);
  });

  it.each(["add", "remove", "mood", "reset", "example", "surprise"] as const)(
    "aborts on %s and ignores a late success even if the mock ignores abort",
    async change => {
      const pending = deferred<Story>();
      generate.mockReturnValueOnce(pending.promise);
      const { user } = await openHome();
      await startExample(user);
      const signal = generate.mock.calls[0]![1]!.signal!;
      expect(signal.aborted).toBe(false);
      expect(screen.getByTestId("text-loading")).toBeInTheDocument();
      if (change === "add") await user.click(screen.getByRole("button", { name: "Add dog" }));
      if (change === "remove") await user.click(screen.getByRole("button", { name: "Remove cat" }));
      if (change === "mood") await user.click(screen.getByRole("radio", { name: /Mystery/ }));
      if (change === "reset") await user.click(screen.getByRole("button", { name: "Reset" }));
      if (change === "example") await user.click(screen.getByRole("button", { name: "Try the example" }));
      if (change === "surprise") {
        vi.spyOn(Math, "random").mockReturnValue(0.5);
        await user.click(screen.getByRole("button", { name: "Surprise me" }));
        vi.mocked(Math.random).mockRestore();
      }
      expect(signal.aborted).toBe(true);
      expect(screen.queryByTestId("text-loading")).not.toBeInTheDocument();
      await act(async () => pending.resolve(prepared));
      expect(screen.queryByTestId("result")).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(speechMock.speak).not.toHaveBeenCalled();
      expect(generate).toHaveBeenCalledTimes(1);
      if (change === "reset") {
        expect(collectedIds()).toEqual([]);
        expect(screen.getByRole("radio", { name: /Calm/ })).toBeChecked();
      }
    },
  );

  it.each(["success", "failure"])("keeps the newer story after a late %s from an older request", async outcome => {
    const pending = deferred<Story>();
    generate.mockReset().mockReturnValueOnce(pending.promise).mockResolvedValueOnce(nextStory);
    const { user, unmount } = await openHome();
    await startExample(user);
    await user.click(screen.getByRole("radio", { name: /Funny/ }));
    await user.click(screen.getByRole("button", { name: "Make my story" }));
    expect(await screen.findByTestId("text-title")).toHaveTextContent(nextStory.title);
    const narrated = speechMock.speak.mock.calls.length;
    await act(async () => {
      if (outcome === "success") pending.resolve(prepared);
      else pending.reject({ data: { message: "Old request failed" } });
    });
    expect(screen.getByTestId("text-story").textContent).toBe(nextStory.story);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(speechMock.speak).toHaveBeenCalledTimes(narrated);
    unmount();
  });

  it("does not cancel pending generation for duplicate additions, search, category, or unchanged mood", async () => {
    const pending = deferred<Story>();
    generate.mockReturnValueOnce(pending.promise);
    const { user } = await openHome();
    await startExample(user);
    const signal = generate.mock.calls[0]![1]!.signal!;
    await user.click(screen.getByTestId("tile-cat"));
    dragToTray("cat");
    await user.type(screen.getByRole("searchbox"), "kitten");
    await user.click(screen.getByRole("button", { name: "Animals" }));
    await user.click(screen.getByRole("radio", { name: /Calm/ }));
    expect(signal.aborted).toBe(false);
    await act(async () => pending.resolve(prepared));
    expect(screen.getByTestId("text-story").textContent).toBe(prepared.story);
    expect(collectedIds()).toEqual(exampleIds);
  });

  it("aborts status and generation and cleans up speech on unmount", async () => {
    const pending = deferred<Story>();
    generate.mockReturnValueOnce(pending.promise);
    const { user, unmount } = await openHome();
    await startExample(user);
    const signal = generate.mock.calls[0]![1]!.signal!;
    const statusSignal = status.mock.calls[0]![0]!.signal!;
    unmount();
    expect(signal.aborted).toBe(true);
    expect(statusSignal.aborted).toBe(true);
    expect(speechMock.cancel).toHaveBeenCalled();
    expect(speechMock.removeEventListener).toHaveBeenCalledWith("voiceschanged", expect.any(Function));
    await act(async () => pending.resolve(prepared));
    expect(speechMock.speak).not.toHaveBeenCalled();
  });

  it("shows an API error and retries without losing objects", async () => {
    generate.mockRejectedValueOnce({ data: { message: "Please try again shortly." } });
    const { user } = await openHome();
    await startExample(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Please try again shortly.");
    expect(collectedIds()).toEqual(exampleIds);
    expect(speechMock.speak).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Make my story" }));
    expect(await screen.findByTestId("result")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("keeps the result readable when narration is blocked and retries Play without generation", async () => {
    speechMock.getVoices.mockReturnValue([]);
    const { user } = await openHome();
    await startExample(user);
    expect(await screen.findByTestId("text-story")).toHaveTextContent(prepared.story);
    expect(screen.getByText("Your story is ready. Press Play to listen.")).toBeInTheDocument();
    expect(speechMock.speak).not.toHaveBeenCalled();
    speechMock.getVoices.mockReturnValue([{
      name: "English", lang: "en-IN", default: true, localService: true, voiceURI: "test",
    }]);
    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.queryByText("Your story is ready. Press Play to listen.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Replay" })).toBeInTheDocument();
    expect(generate).toHaveBeenCalledTimes(1);
    speechMock.cancel.mockClear();
    await user.click(screen.getByRole("button", { name: "Remove cat" }));
    expect(screen.queryByTestId("result")).not.toBeInTheDocument();
    expect(screen.queryByTestId("slot-cat")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make my story" })).toBeEnabled();
    expect(speechMock.cancel).toHaveBeenCalledTimes(1);
  });
});
