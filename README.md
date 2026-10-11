# StoryBowl

Ordinary things. Unexpected stories. A personal English-language learning prototype for adult testers—not a child-directed product.

## Run

Use the configured StoryBowl and API Server Run workflows in Replit. Dependencies are managed with `pnpm install`; source and the lockfile are included. No database or account setup is required.

- `pnpm test` — unit and composed frontend interaction tests, with mocked provider/API calls (no paid requests).
- `pnpm --filter @workspace/storybowl test:interactions` — only the repeatable DOM and narration checks.
- `pnpm run typecheck` — workspace TypeScript checks.
- `PORT=18762 BASE_PATH=/ pnpm --filter @workspace/storybowl build` — production frontend.
- `pnpm --filter @workspace/api-server build` — production API.

## Single live-mode setup step

Add **GROQ_API_KEY** in the project's **Tools → Secrets**, then restart the API Server workflow. Never paste it into source or use a `VITE_` variable. `.env.example` contains placeholders only; a real `.env` is ignored. The key is read only by server code.

`GROQ_MODEL` defaults to `openai/gpt-oss-20b`. To use a different Groq model, set that server environment variable; it must support the requested output format. No second provider or automatic model switch is used.

## Demo mode

Without a key, or with `DEMO_MODE=true`, `/api/status` reports demo mode. **Try the example** loads umbrella, cat, lamp, letter, and rain and immediately generates. Each mood has one prepared 200–300-word story in four paragraphs. Other selections remain selectable but cannot generate until the owner supplies the key. **New story** in demo repeats the prepared mood fixture. Live provider failures never become canned stories.

## Read the code

- `lib/story-core/src/index.ts`: all 76 objects, aliases, demo stories, input and story validation.
- `artifacts/storybowl/src`: the UI components, client-only Lucide icons, state reducer, and `useSpeech`.
- `artifacts/api-server/src/lib/story.ts`: the verbatim story prompt and direct Groq REST calls.
- `artifacts/api-server/src/routes/story.ts`: `GET /api/status` and `POST /api/story`.
- `lib/api-spec/openapi.yaml`: API contract. Regenerate helpers using `pnpm --filter @workspace/api-spec codegen` after edits.

Stories use everyday Indian settings, Indian names where useful, and simple spoken English. The prompt avoids stereotypes, complicated vocabulary, unexplained regional-language words, and confusing poetic endings. A selected focal object, perspective, setting, and mood-appropriate ending give each request variety. These are prompt instructions, not a guarantee of cultural accuracy or readability.

The server validates a 200–300-word story (title excluded), 3–4 blank-line-separated paragraphs, a proper title, and object coverage, and permits exactly one repair. The prompt aims for 230–270 words, a setup, a twist, a concrete payoff, and meaningful roles for every object. Strict JSON schema has at most one fallback to JSON-object mode when the provider explicitly rejects the format. Each server request has a 20-second timeout. Coverage is a prefix/phrase heuristic, not a guarantee of causal roles or believable prose: model-generated story quality still varies.

The browser automatically retries temporary story failures twice, pausing 650ms and 1300ms, without showing an error on the first failure. A user action has at most three server requests (each can have the single output repair above). Permanent input/setup errors are not retried. All attempts and pauses are cancelled on reset, changed selections/mood, or unmount. Loading locks generation with disabled controls and a synchronous guard. Exhausted failures show a storyteller-hiccup message and **Try again**, preserving selections. Free Groq quota/rate limits still apply; retries cannot remove provider limits.

## Narration and privacy

Browser speech synthesis selects an available English voice and queues one sentence at a time. Replay reads saved text without another generation request. Voices, availability, and autoplay behavior depend on the browser/device. Text remains usable without speech; no voice selector or microphone is used. Consistent audio across devices would need a hosted narrator later.

Selections and recent openings live in tab memory. Every successful story also saves automatically in a versioned browser-local library (`storybowl.library`), with favorites and saved time. Users can browse, reopen without an AI call, star, and confirm deletion. Reset clears the composition, not the library. Storage warnings explain blocked, corrupt, or full storage; corrupt stored data is not overwritten, and unsaved stories stay in memory for the visit. History is not an account or cloud backup: clearing browser data removes it, and it doesn't sync across devices.

In live mode, selected object names and generated stories (including repair text and up to two recent openings) are sent to Groq. There is no database, account, analytics, hosted audio, or microphone recording. Browser voice-service processing depends on the device; local voices are preferred. Share uses the native sheet where available, otherwise copies title, text, and the verified public app link; manual selection is available if clipboard access fails. Native cancellation does not copy or publish anything. Narration reports preparing/speaking/blocked/missing-voice states and supports stopping while preparing. Actual audio quality depends on the device.

## Troubleshooting

- **Missing key:** use the example set, or add the server-only key and restart the API.
- **429:** wait before trying again; Groq may also enforce its own quota. The app allows 20 requests per ten minutes per IP. Its in-memory limit resets on restart, is per process, and is **not a spending cap**.
- **No English voice / blocked narration:** story text still works. Press Play to retry, or enable an English system voice.
- **Model unavailable:** check the owner's key, Groq access, and `GROQ_MODEL`; the app never changes models silently.
- **Invalid or timed-out story:** keep your objects and request New story / Make my story again.

The IP limiter assumes access through Replit's trusted reverse proxy and uses only the rightmost proxy-appended `X-Forwarded-For` entry, never the client-controlled leftmost entry. If serving the API directly outside this configuration, disable forwarding-header trust or configure your trusted proxy explicitly. The prototype is not designed as an abuse-resistant public paid service.

## Verification limits

Frontend interaction tests mount the real Home, ObjectShelf, StoryBowl, StoryResult, and speech hook in jsdom. Generated API functions return deterministic prepared stories; unexpected network calls fail. Speech synthesis uses a local mock with manually controlled events and no audio. Tests cover click/Enter/Space/drop selection, duplicate/full-tray limits, search/categories/removal/mood, canceled and out-of-order requests, result rendering, New story, and replay without generation. They need no secrets, ports, or running workflows.

Mocked tests can verify request budgets, validation, and stale state without credentials. A real Groq request requires the owner's key. A screenshot verifies initial rendering, not drag/drop or audible narration. Cross-device voice quality and blocked-autoplay behavior require those browsers/devices.

Lucide/Feather notices are included in `LICENSE-LUCIDE.txt`.
