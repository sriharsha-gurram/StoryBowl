# StoryBowl writing-quality pilot

## Recommendation

**Keep the current Groq provider and `openai/gpt-oss-20b` configuration for now. Do not describe its stories as reliably realistic.** Neither an expanded realism prompt nor a separate structured-facts approach established a useful improvement, so neither was promoted to the running app. The existing prompt remains in place. This is a completed evaluation and recommendation, **not a demonstrated user-facing realism improvement**.

The best next model candidate for an **owner-approved, limited comparison** is `openai/gpt-oss-120b`: Groq lists it as production-ready, it supports the same strict JSON schema, and its published token prices are twice the 20B prices. This is a suitability recommendation, **not evidence that it writes better stories**. No alternate model was called, no provider/model setting was changed, and no credentials were requested.

Before any switch, compare both models on these cases with several repetitions, blind human scoring, actual billed-token usage and end-to-end latency. Require fewer causal failures and stronger mystery endings without losing the 100–150-word success rate or the shared 20-second deadline. A larger parameter count or reasoning benchmark alone is not a storytelling-quality result.

## What was measured

Recorded on 2026-10-08, using the existing credential through application code (never printed):

- Three fixed selections, each tested in calm, funny and mystery: **nine cases**.
- 3 objects: key, door, cat.
- 5 objects: umbrella, letter, bicycle, cake, dog.
- 10 objects: rocket, magic wand, crown, snowflake, fish, train, phone, key, cake, umbrella. This deliberately stresses unusual props and crowded plots.
- Both prompts used the same model, temperature 0.7, focal object (first selected object), Pune neighbourhood, close third-person perspective, and first ending-style choice.
- These controls fix prompt variation, **not model output**. No provider seed was specified. One output per case is a small exploratory sample, not a statistically reliable comparison.
- The experiment asked for one situation, grounded props before use, ordinary animal behaviour, consistent object locations, and a concrete explanation of the original mystery. Its full system prompt is retained in `revised.json`.
- Generation used the actual `createStory` function: 4096 completion-token budget, low reasoning effort, strict JSON with the existing one-format-fallback allowance, **one structural repair**, and **one shared 20-second timeout**. No extra model-based quality grader or hidden retries were introduced.
- The experimental repair message also reinforced one situation, ordinary props and a concrete cause. The original repair message was restored with the original prompt.

### Raw evidence

All files contain the model ID, prompt snapshot, selected objects, public generated fiction, safe usage fields, statuses, timing and repair count. They contain no credentials, authorization headers, hidden reasoning, or raw provider error bodies.

- [`baseline.json`](baseline.json): initial nine attempts. Five stories returned; one HTTP 400 mapped to `PROVIDER_REFUSED`; three attempts returned HTTP 429.
- [`baseline-retry.json`](baseline-retry.json): an explicitly separate, paced rerun of those four failed cases, with the **same original prompt**. This produced two stories and two `STORY_INVALID` results. These are dataset reruns, not additional retries inside a user request.
- [`revised.json`](revised.json): all nine experimental-prompt cases, paced 15 seconds apart.
- [`story-facts.json`](story-facts.json): a second, different approach tested against the same nine cases. A compact prompt asked for concrete facts and a required per-object role in the same response before prose; no extra provider call was added.

For the completed baseline below, use the first five baseline cases and the four cases from `baseline-retry.json`. Do not hide the earlier errors when reporting operational reliability. The `humanReview: null` field in raw files means the collector does not automatically judge prose; the human scores and evidence are documented below.

## Structural results, cost and latency

| Measurement | Completed baseline | Experimental prompt |
| --- | ---: | ---: |
| Returned stories passing structural checks | 7/9 | 7/9 |
| Failed after the allowed repair | 2/9 | 2/9 |
| Word-count range of returned stories | 115–146 | 120–141 |
| Cases using a repair | 4/9 | 3/9 |
| Provider requests, including repairs | 13 | 12 |
| Median end-to-end generation time | 486 ms | 514 ms |
| Maximum observed generation time | 1,116 ms | 1,316 ms |
| Reported prompt tokens | 13,413 | 14,185 |
| Reported completion tokens, including reasoning | 2,840 | 2,639 |
| Estimated token cost at current published rates | $0.001858 | $0.001856 |

There were **29 provider requests overall**: 17 across the initial baseline plus its paced rerun, and 12 for the experiment. Four failed requests had no usage returned. Across responses with usage, the published-rate estimate is **$0.003714**; it is not a billing receipt and does not assign unknown charges to failed requests.

The later structured-facts run adds 12 requests, for **41 requests across the entire evaluation**. Its reported token estimate is $0.001971, bringing the overall reported-usage estimate to **$0.005685**. It had another HTTP 400 with no usage; charges for all five failed requests without usage remain unknown.

Token estimate: `(promptTokens × $0.075 + completionTokens × $0.30) / 1,000,000`, without assuming a cached-input discount. Completion counts include the reported reasoning tokens. Repairs increase both input and output consumption.

End-to-end sample timing includes response consumption, validation and repair, but excludes dataset pacing. Per-call timing is measured when response headers arrive; provider timing fields are also retained. These figures are from this environment and account, not guaranteed user latency or a service-level promise. The initial rate limits show why the final collector paces requests; account-specific limits may still require a longer gap.

Ten-object structural failures remained:

- Original calm: final repair 164 words, with missing objects.
- Original funny: final repair 150 words, but missing train.
- Experimental funny: final repair 153 words.
- Experimental mystery: final repair 160 words.

## Human scoring, not a runtime validator

Each dimension is scored **0–2**, using the rubric in `artifacts/api-server/src/lib/story-eval.cases.ts`:

1. **English (E):** simple, grammatical language understood on one hearing.
2. **Backdrop (B):** an ordinary Indian setting integrated into the action, rather than just a place name or stereotype.
3. **Cause/effect (C):** believable setup, consistent events, earned ending.
4. **Object use (O):** two or three drive actions; others support the same situation naturally.
5. **Mood/payoff (M):** visible helpful action for calm, action-caused comic consequence for funny, or a clue and concrete explanation of the original question for mystery.

0 means a clear failure; 1 means partial/weak; 2 means clear success. Reviewer: Replit Agent reading the actual returned stories, not a second provider call. Scores are subjective and unblinded; a second reviewer may disagree. A useful proposed quality target is at least 8/10 with C, O and M each 2. This is an evaluation target only, not a production gate.

### Original prompt

| Case | Words / outcome | E/B/C/O/M | Evidence |
| --- | --- | --- | --- |
| 3 calm | 115 | 2/1/0/1/1 | Arjun forgot his key **in the kitchen**, then takes it from his pocket to enter. Calm tone, but the only complication contradicts itself. |
| 3 funny | 127 | 1/1/0/1/0 | Meera unlocks with a key, then finds the supposedly missing key in the cat's mouth. The second key is not established; laughter replaces a coherent joke. |
| 3 mystery | 132 | 1/1/0/0/0 | Cat leads Rohan to a box containing “The key opens the door to your own curiosity.” Nobody explains the note or its author. Ending claims the cat left a clue. |
| 5 calm | 125 | 1/1/1/1/1 | Neha comes home, reads a letter, and serves cake. Plausible overall, but “carrying ... a small bicycle,” “golden-faced,” and several idle props weaken naturalness. |
| 5 funny | 139 | 1/1/0/0/0 | A girl suddenly has a cake; a dog's tail knocks it into a mailbox. Why the cake arrives and why anyone mistakes the delivery are not established. |
| 5 mystery | 131 | 1/1/0/0/0 | Missing cake, anonymous letter telling Ravi to visit a bakery tomorrow, and a dog bringing crumbs. “The dog had hidden the cake to protect it from a stray cat” explains neither the letter nor the bakery. |
| 10 calm | STORY_INVALID | — | No returned story; retained drafts place a snowflake on a nearby plant, leave props unexplained, and exceed length after repair. |
| 10 funny | STORY_INVALID | — | No returned story; draft has a fish swimming beside a fence, unexplained rocket flight, and loses train during repair. |
| 10 mystery | 146 | 1/1/0/0/0 | A spell frees a key; a rocket flies and makes cake appear. Calling it a neighbour's toy at the end does not explain those events. |

### Experimental prompt

| Case | Words / outcome | E/B/C/O/M | Evidence |
| --- | --- | --- | --- |
| 3 calm | 122 | 2/1/0/1/1 | Rohan enters, sits down inside, then unlocks the door and steps in again. The key's role is clearer, but the location resets without explanation. |
| 3 funny | 141 | 1/1/0/1/1 | Key found on balcony fails; key then appears in pocket. A wrong-key joke is possible but no second key is established. Orange-bowl mishap is unrelated. |
| 3 mystery | 123 | 2/1/0/0/0 | Cat nudges a written mailbox clue; ending says it hid the key for “the right moment.” No human author or realistic cause is given. |
| 5 calm | 126 | 1/1/1/1/1 | Sister asks for baking help; cake is suddenly ready in a neighbour's kitchen. Potentially plausible, but transition and object purposes are weak. |
| 5 funny | 120 | 1/1/0/0/0 | Arjun goes to a shop **for** a cake but already spills it on the way. Dog “saved the cake” is only a quip, not an explanation. |
| 5 mystery | 126 | 1/1/0/0/0 | Ending says the dog put a letter into an umbrella. It does not explain the message's author or cardboard cake. |
| 10 calm | 124 | 1/1/0/1/1 | Cardboard rocket, plastic wand and paper crown are grounded earlier. But pressing the wand moves the rocket without a mechanism; fish is handled implausibly and props are still crowded. |
| 10 funny | STORY_INVALID | — | No returned story; bus stop/train mix-up, unexplained cake inside rocket, and key added as an afterthought; 153-word repair rejected. |
| 10 mystery | STORY_INVALID | — | No returned story; arbitrary lock-pick and driver explanation do not explain why the key was attached to the rocket; 160-word repair rejected. |

**None of the 14 returned stories earned C=2 or met the proposed quality target.** The experiment grounded some difficult objects earlier, but did not establish reliable cause/effect or meaningful endings. Six size/mood cases returned a story in both runs; the seventh differs (original 10-mystery versus experimental 10-calm), so a single aggregate prose-score average would hide differing failures. More explicit instructions did not demonstrate a shipping-worthy gain in this pilot.

These examples also show why `storyProblems` must remain labelled **structural**: its prefix-based object coverage is intentionally heuristic, and neither coverage nor word count proves writing quality. A new offline regression example demonstrates that a magical story can pass the structural checks.

### Second approach: structured fictional facts before prose

This was not just another longer realism instruction. The same model and request budget were used with a shorter system prompt and a different strict response schema:

- Required `storyFacts`: `situation`, `cause`, `resolution`, and `objectRoles`, with one required string property per selected object ID.
- Required `title` and `story` with the unchanged public 100–150-word validator.
- The prompt instructed the model to output facts first and reuse the same cause and resolution in prose.
- Server-owned representations grounded rocket as a cardboard model, magic wand as a plastic prop, crown as a paper costume, snowflake as a paper decoration, and fish as an aquarium animal or clearly labelled picture/prop.
- The one repair reinforced preserving the same concrete cause and resolution. Facts were stripped before returning title/story to the browser in this experimental implementation.
- The existing style example, fixed Pune setting, choices, temperature, model, reasoning effort and shared timeout were preserved. Actual provider output order did not reliably follow the requested facts-first order.

Results: **6/9** returned stories; two failed structural repair and one returned HTTP 400 (`PROVIDER_REFUSED`). Three cases used a repair, for 12 requests. Median end-to-end time **610 ms**, maximum **1,535 ms**. Reported prompt/completion tokens: **11,117 / 3,791**, including the additional generated facts. Estimated cost **$0.001971**.

| Case | Words / outcome | E/B/C/O/M | Evidence |
| --- | --- | --- | --- |
| 3 calm | STORY_INVALID | — | Both drafts are under 100 words and still place an already-held key in an inaccessible kitchen. |
| 3 funny | 114 | 1/1/0/1/0 | Owner forgets key inside but opens with it; a cat then both drops and holds it. Facts did not prevent contradictory possession. |
| 3 mystery | 117 | 2/1/0/1/0 | Key opens a neighbour's flat, then is declared to belong to an old house. No evidence identifies who dropped it or how that deduction was made. |
| 5 calm | 106 | 2/1/1/1/1 | Umbrella protects bicycle/letter, but a shopkeeper's dog unexpectedly brings cake and the ending shifts location without a clear helpful human action. |
| 5 funny | PROVIDER_REFUSED | — | No returned story; HTTP 400 is retained, with no raw error text or invented prose score. |
| 5 mystery | 134 | 1/1/0/1/0 | Letter asks Arjun to keep a missing diary safe; dog leads him to cake and diary in a tree hollow. Why the neighbour hid these or left that message remains incoherent. |
| 10 calm | STORY_INVALID | — | Both drafts are under 100 words; objects are listed while an electrician is called just to turn on a forgotten light switch. |
| 10 funny | 120 | 2/1/1/0/1 | Ordinary pretend rocket launch is a modest improvement over magic, but all ten objects are listed, bike key confusion is weak, and the windy umbrella/cake payoff is unrelated. |
| 10 mystery | 110 | 1/1/0/0/0 | Fish picture becomes a real fish; rocket is hidden under a tank; neighbour's attempted theft is asserted without evidence. “Aquarium door” and sharing an umbrella as thanks are awkward. |

The structured-facts approach also had **no C=2 stories and no quality-target passes**. Its two returned ten-object stories did not demonstrate believable plots, and overall structural success decreased. The experimental implementation was removed rather than shipped as an unsupported improvement; its system prompt and generated facts/prose remain in the raw evidence. Across all three approaches, **20 stories returned from 27 distinct case runs**, with four additional initial baseline error attempts retained separately.

Further prompt-only iteration on this same small sample is not justified by these outcomes. The recommendation remains an approved model comparison or another explicitly agreed approach, not a silent model change or a claim that a single prompt guarantees realism.

## Official Groq model comparison

Checked against official Groq documentation on 2026-10-08. Prices are USD per million tokens; speed is published generation throughput, **not end-to-end latency**.

| Model | Availability | Input / output | Published speed | Format suitability |
| --- | --- | --- | --- | --- |
| `openai/gpt-oss-20b` | Production; current default | $0.075 / $0.30 | ~1,000 tokens/sec | Strict schema; low reasoning already used |
| `openai/gpt-oss-120b` | Production; recommended comparison candidate | $0.15 / $0.60 | ~500 tokens/sec | Same strict schema; compatible low reasoning |
| `llama-3.3-70b-versatile` | Listed as Enterprise production | Contact Sales; no public current token price in fetched model table | ~280 tokens/sec | JSON object mode, not strict schema; current fallback would add a request when strict format is rejected |

For an **illustrative** single request with 1,000 input and 250 completion tokens, 20B costs $0.00015 and 120B $0.00030. At published throughput, emitting 250 completion tokens takes approximately 0.25 seconds versus 0.50 seconds (Llama: 0.89 seconds). These are arithmetic illustrations, not measurements of those models on StoryBowl. Actual reasoning tokens, prompt processing, queueing, network and repairs can dominate.

Do not reuse historical Llama prices as current prices: the official table fetched here says Contact Sales. Avoid preview models for the running app; Groq says they can be discontinued at short notice. Strict schema promises format adherence, **not realism**, word-count accuracy or narrative logic.

Sources:

- [Supported models: production status, prices and speed](https://console.groq.com/docs/models)
- [GPT-OSS 20B model page](https://console.groq.com/docs/model/openai/gpt-oss-20b)
- [GPT-OSS 120B model page](https://console.groq.com/docs/model/openai/gpt-oss-120b)
- [Llama 3.3 70B model page](https://console.groq.com/docs/model/llama-3.3-70b-versatile)
- [Structured outputs: strict support versus JSON object mode](https://console.groq.com/docs/structured-outputs)

## Repeat the evaluation

Routine checks are offline and do not spend credits:

```sh
pnpm test
pnpm run typecheck
```

For an intentionally paid live sample, run from the **workspace root** with an existing Groq credential. This samples the **current production prompt**, not the discarded experimental prompt:

```sh
STORY_EVAL_LIVE=1 STORY_EVAL_LABEL=my-review \
  pnpm exec vitest run artifacts/api-server/src/lib/story-eval.test.ts --project unit
```

Use a fresh label; the collector refuses to overwrite an existing evidence file. An optional `STORY_EVAL_CASES=10-calm,10-funny,10-mystery` limits the run. Each story has the normal repair/deadline budget; dataset pacing occurs outside that deadline. The collector never changes `GROQ_MODEL`, never requests a credential, and never calls a different model automatically. A passed collector test means records were written, **not that stories were valid or good**.

For a model comparison or prompt experiment, get approval first, keep application settings unchanged, and retain a separate labelled run with the exact tested prompt/model. Review returned prose with the same rubric, record explicit failure outcomes, and avoid cherry-picking only successful ten-object examples. Try multiple repetitions and other settings before claiming a general improvement.

## Preserved behaviour

No frontend or narration code changed. Stories still require 100–150 words excluding the title; exactly one content repair and the existing format fallback share a single timeout. Browser speech remains the narrator. Offline tests cover word boundaries, repair count, shared deadline, fixed evaluation choices, and existing narration/interaction checks.
