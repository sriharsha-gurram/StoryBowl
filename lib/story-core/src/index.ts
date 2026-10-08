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
  calm: { title: "A Place by the Window", story: "Rain tapped the window as Mira folded her umbrella beside the lamp. A damp cat appeared at the door, carrying a letter under its collar. Inside was a single line: save me a warm spot. Mira spread a towel on the chair. The cat settled down, as though it had made a reservation." },
  funny: { title: "The Very Important Guest", story: "The cat arrived in the rain with a letter demanding dinner at seven. Nora opened her umbrella to escort it inside and switched on the lamp. At seven sharp, it inspected an empty plate, then pushed the letter toward her. On the back, in tiny paw prints, it said: bring your own fish." },
  mystery: { title: "The Light Next Door", story: "Each night of rain, the lamp in the empty house glowed. Tonight, a cat led Lena there beneath her umbrella. A letter waited on the step, addressed to tomorrow. Inside was a drawing of Lena opening it. She looked up. Behind the window, the cat was carefully sketching the next visitor." },
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
