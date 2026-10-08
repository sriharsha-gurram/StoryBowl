// Defines the shared object registry, demo fixtures, and story checks.
// Both server and browser use this source so object meanings cannot drift.
export type Mood = "calm" | "funny" | "mystery";
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
  calm: { title: "A Dry Place to Wait", story: "Rain filled the lane outside Meera's flat in Pune. She left her umbrella by the door and turned on the lamp. A wet cat followed her inside, brushing against a letter from her brother. Meera moved the letter and spread a towel. The cat curled up beside her while she read it." },
  funny: { title: "The Cat Came First", story: "In a Chennai flat, Ravi put a letter beside the lamp and opened his umbrella to check the rain. His cat slipped past him and sat on the letter. Ravi gently pulled it free. It was an invitation to his neighbour's dinner. The cat had already reached their kitchen before he found his sandals." },
  mystery: { title: "Who Left the Letter?", story: "After the rain, Asha found a letter under the lamp outside her Jaipur home. It said, look behind your umbrella. Her cat was sitting there beside a small box. Inside was the key she had lost yesterday. Her neighbour waved from the gate. He had found it, and the cat had followed him home." },
};
export const words = (text: string) => text.trim().split(/\s+/u).filter(Boolean);
export function storyProblems(value: unknown, ids: string[]): string[] {
  if (!value || typeof value !== "object") return ["invalid JSON object"];
  const { title, story } = value as Record<string, unknown>;
  if (typeof title !== "string" || typeof story !== "string") return ["title and story must be strings"];
  const problems: string[] = [];
  if (!title.trim() || words(title).length > 8) problems.push("title must contain one to eight words");
  const count = words(story).length;
  if (count < 45 || count > 65) problems.push(`${count > 65 ? "too long" : "too short"}: ${count} words`);
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
