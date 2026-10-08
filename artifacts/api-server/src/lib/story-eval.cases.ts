// Fixed selections expose ordinary, mixed and awkward-object writing problems.
// Human review is separate from structural validation; these are not quality guarantees.
import type { Mood, StoryPayload } from "@workspace/story-core";

const selections = [
  { size: 3, objectIds: ["key", "door", "cat"] },
  { size: 5, objectIds: ["umbrella", "letter", "bicycle", "cake", "dog"] },
  { size: 10, objectIds: ["rocket", "magic-wand", "crown", "snowflake", "fish", "train", "phone", "key", "cake", "umbrella"] },
];
export const evaluationCases: { id: string; payload: StoryPayload }[] =
  selections.flatMap(({ size, objectIds }) =>
    (["calm", "funny", "mystery"] as Mood[]).map(mood => ({
      id: `${size}-${mood}`, payload: { objectIds, mood, recentOpenings: [] },
    })));

export const qualityRubric = {
  plainEnglish: "0: hard to follow aloud; 1: minor awkward/abstract phrases; 2: simple, grammatical actions understood on one hearing.",
  indianBackdrop: "0: absent/stereotyped; 1: named Indian place only; 2: ordinary Indian setting integrated into the action without stereotypes.",
  causeEffect: "0: impossible/contradictory or unexplained event; 1: plausible but a causal gap or unearned ending; 2: setup, change and ending form a believable chain.",
  objectUse: "0: list or forced/impossible uses; 1: all mentioned but some decorative/contrived; 2: two or three drive action, others have plausible supporting roles.",
  moodPayoff: "0: absent, or mystery answers a different question; 1: recognisable mood but weak ending; 2: helpful calm action, action-caused comic payoff, or evidence resolving the original mystery.",
};
