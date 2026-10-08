// Defines the shared object registry, demo fixtures, and story checks.
// Both server and browser use this source so object meanings cannot drift.
export type Mood = "calm" | "funny" | "mystery";
export const MIN_STORY_WORDS = 100;
export const MAX_STORY_WORDS = 150;
export const categories = ["Nature", "Animals", "People & places", "Everyday things", "Food & drink", "Travel"] as const;
const groups = [
  "tree flower leaf mountain ocean sun moon star cloud rain snowflake rainbow wind flame",
  "dog cat bird fish rabbit turtle snail squirrel beetle worm",
  "person family baby house castle school shop tent fence mailbox",
  "armchair bed lamp door key clock umbrella book pencil letter gift camera phone bell backpack glasses crown magic-wand flashlight guitar",
  "apple banana carrot cherry lemon croissant cake cookie egg coffee pizza ice-cream",
  "bicycle car bus train sailboat airplane rocket map compass suitcase",
];
const synonyms: Record<string, string[]> = {
  tree: ["pine"], flower: ["blossom"], ocean: ["sea", "waves"], sun: ["sunny", "sunlight"],
  rain: ["rainy", "raining"], flame: ["fire"], dog: ["puppy", "dogs"], cat: ["kitten", "cats"],
  bird: ["birds"], beetle: ["bug"], person: ["people"], family: ["families"],
  house: ["home"], shop: ["store"], bed: ["bedroom"], letter: ["mail"], phone: ["telephone"],
  "magic-wand": ["wand"], "ice-cream": ["ice cream", "icecream"], bicycle: ["bike"], suitcase: ["luggage"],
};
export const catalog = groups.flatMap((group, i) => group.split(" ").map(id => ({
  id, label: id.replaceAll("-", " "), category: categories[i]!,
  aliases: [id.replaceAll("-", " ") + "s", ...(synonyms[id] ?? [])],
})));
export const exampleIds = ["umbrella", "cat", "lamp", "letter", "rain"];
export const fixtures: Record<Mood, { title: string; story: string }> = {
  calm: { title: "A Dry Place to Wait", story: "Rain filled the lane outside Meera's flat in Pune just as she returned from work. She closed her umbrella by the door and switched on the lamp. A wet cat followed her inside and shook itself beside a letter from her brother. Meera quickly moved the letter and spread an old towel on the floor. The cat stepped onto it, then settled down with a long sigh. Her brother had written that he would visit on Sunday and help fix the leaking window. Meera called him to say the room now had a guest. While they talked, the rain slowed. When she finally opened the door, the cat stayed exactly where it was." },
  funny: { title: "The Cat Came First", story: "In a Chennai flat, Ravi found a letter inviting him to his neighbour's dinner. He put it beside the lamp and opened his umbrella to check the rain. His cat slipped past him into the corridor. Ravi called it back, but it stopped outside the neighbour's kitchen and began to cry. The neighbour opened her door, saw the cat, and asked where Ravi was. He arrived a minute later with wet sandals and the invitation in his hand. He apologised for being early. She pointed to the empty plate by the kitchen door. The cat had already finished its dinner. Ravi looked at it and said, next time, please wait for me." },
  mystery: { title: "Who Left the Letter?", story: "After the rain, Asha found a letter under the lamp outside her Jaipur home. It said, look behind your umbrella. She checked the handwriting, but there was no name. Her cat was sitting beside the umbrella, guarding a small box. Inside was the key she had lost on her way to the market yesterday. Asha wondered who knew where she lived. Then her neighbour waved from the gate. He had found the key near his shop and recognised the red thread tied around it. He had knocked while she was out, and the cat had followed him upstairs. Asha thanked him and picked up the key. The cat followed her inside, still expecting a reward." },
};
export const words = (text: string) => text.trim().split(/\s+/u).filter(Boolean);
// Structural checks only: neither word count nor label coverage measures realism.
// Use the offline evaluation rubric for plot logic, mood and meaningful object use.
export function storyProblems(value: unknown, ids: string[]): string[] {
  if (!value || typeof value !== "object") return ["invalid JSON object"];
  const { title, story } = value as Record<string, unknown>;
  if (typeof title !== "string" || typeof story !== "string") return ["title and story must be strings"];
  const problems: string[] = [];
  if (!title.trim() || words(title).length > 8) problems.push("title must contain one to eight words");
  const count = words(story).length;
  if (/[}\]]\s*$/.test(story)) problems.push("stray JSON closing character in story");
  if (count < MIN_STORY_WORDS || count > MAX_STORY_WORDS) problems.push(`${count > MAX_STORY_WORDS ? "too long" : "too short"}: ${count} words`);
  const tokens: string[] = story.toLowerCase().match(/[a-z]+/g) ?? [];
  // Prefix coverage is deliberately heuristic and can produce false positives.
  // Multiword labels are checked as phrases; single words use the specified prefix rule.
  const missing = ids.filter(id => {
    const item = catalog.find(o => o.id === id);
    return !item || ![item.label, ...item.aliases].filter(a => a.length >= 3).some(a =>
      a.includes(" ") ? story.toLowerCase().includes(a) : tokens.some(t => t.startsWith(a)));
  });
  if (missing.length) problems.push(`missing: ${missing.join(", ")}`);
  return problems;
}
export interface StoryPayload { objectIds: string[]; mood: Mood; recentOpenings?: string[] }
export function validPayload(value: unknown): value is StoryPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  return Object.keys(p).every(k => ["objectIds", "mood", "recentOpenings"].includes(k))
    && Array.isArray(p.objectIds) && p.objectIds.length >= 3 && p.objectIds.length <= 10
    && new Set(p.objectIds).size === p.objectIds.length
    && p.objectIds.every(id => typeof id === "string" && catalog.some(o => o.id === id))
    && ["calm", "funny", "mystery"].includes(p.mood as string)
    && (p.recentOpenings === undefined || (Array.isArray(p.recentOpenings) && p.recentOpenings.length <= 2
      && p.recentOpenings.every(s => typeof s === "string" && s.length <= 160)));
}
