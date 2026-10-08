# StoryBowl

Ordinary things. Unexpected stories. A personal English-language learning prototype for adult testers—not a child-directed product.

## Run

Use the configured StoryBowl and API Server Run workflows in Replit. Dependencies are managed with `pnpm install`; source and the lockfile are included. No database or account setup is required.

- `pnpm test` — unit tests, with mocked Groq calls (no paid requests).
- `pnpm run typecheck` — workspace TypeScript checks.
- `PORT=18762 BASE_PATH=/ pnpm --filter @workspace/storybowl build` — production frontend.
- `pnpm --filter @workspace/api-server build` — production API.

## Single live-mode setup step

Add **GROQ_API_KEY** in the project's **Tools → Secrets**, then restart the API Server workflow. Never paste it into source or use a `VITE_` variable. `.env.example` contains placeholders only; a real `.env` is ignored. The key is read only by server code.

`GROQ_MODEL` defaults to `openai/gpt-oss-20b`. To use a different Groq model, set that server environment variable; it must support the requested output format. No second provider or automatic model switch is used.

## Demo mode

Without a key, or with `DEMO_MODE=true`, `/api/status` reports demo mode. **Try the example** loads umbrella, cat, lamp, letter, and rain. Each mood has one prepared 45–65-word story. Other selections remain selectable but cannot generate until the owner supplies the key. **New story** in demo repeats the prepared mood fixture. Live provider failures never become canned stories.

## Read the code

- `lib/story-core/src/index.ts`: all 76 objects, aliases, demo stories, input and story validation.
- `artifacts/storybowl/src`: the UI components, client-only Lucide icons, state reducer, and `useSpeech`.
- `artifacts/api-server/src/lib/story.ts`: the verbatim story prompt and direct Groq REST calls.
- `artifacts/api-server/src/routes/story.ts`: `GET /api/status` and `POST /api/story`.
- `lib/api-spec/openapi.yaml`: API contract. Regenerate helpers using `pnpm --filter @workspace/api-spec codegen` after edits.

Stories use a selected focal object, perspective, and mood-appropriate ending. The server validates a 45–65-word story and object coverage, and permits exactly one repair. Strict JSON schema has at most one fallback to JSON-object mode when the provider explicitly rejects the format. All attempts share a 20-second timeout. Coverage is a prefix/phrase heuristic, not a guarantee: it can produce false positives.

## Narration and privacy

Browser speech synthesis selects an available English voice and queues one sentence at a time. Replay reads saved text without another generation request. Voices, availability, and autoplay behavior depend on the browser/device. Text remains usable without speech; no voice selector or microphone is used. Consistent audio across devices would need a hosted narrator later.

Selections and the last two stories live only in tab memory. In live mode, selected object names and generated stories (including repair text and up to two recent openings) are sent to Groq. The app does not store them in a database. Speech uses device-provided voices; voice-service processing depends on the browser. Local voices are preferred.

## Troubleshooting

- **Missing key:** use the example set, or add the server-only key and restart the API.
- **429:** wait before trying again; Groq may also enforce its own quota. The app allows 20 requests per ten minutes per IP. Its in-memory limit resets on restart, is per process, and is **not a spending cap**.
- **No English voice / blocked narration:** story text still works. Press Play to retry, or enable an English system voice.
- **Model unavailable:** check the owner's key, Groq access, and `GROQ_MODEL`; the app never changes models silently.
- **Invalid or timed-out story:** keep your ingredients and request New story / Make my story again.

The IP limiter assumes access through Replit's trusted reverse proxy and uses only the rightmost proxy-appended `X-Forwarded-For` entry, never the client-controlled leftmost entry. If serving the API directly outside this configuration, disable forwarding-header trust or configure your trusted proxy explicitly. The prototype is not designed as an abuse-resistant public paid service.

## Verification limits

Mocked tests can verify request budgets, validation, and stale state without credentials. A real Groq request requires the owner's key. A screenshot verifies initial rendering, not drag/drop or audible narration. Cross-device voice quality and blocked-autoplay behavior require those browsers/devices.

Lucide/Feather notices are included in `LICENSE-LUCIDE.txt`.
