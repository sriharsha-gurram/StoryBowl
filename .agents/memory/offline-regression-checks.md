---
name: Offline regression checks
description: Why StoryBowl interaction regression checks use deterministic API and narration substitutes.
---
Keep repeatable frontend regression checks offline, with deterministic generation responses and controlled speech events. Unexpected network attempts must fail, even if application error handling catches the original network exception.

**Why:** The assigned interaction-check requirements explicitly prohibit spending Groq credits or requiring secrets. Real device voices and autoplay timing also make routine checks nondeterministic.

**How to apply:** Preserve this safety constraint when expanding checks or changing their tooling. DOM simulations verify composition and event/state wiring, not actual drag geometry, autoplay policy, or audible voice quality; assess those separately with targeted browser/device checks.

Give browser testers complete deterministic fixture payloads inline rather than assuming they can read the main agent's temporary files or shared workspace packages.

**Why:** A tester's scoped checkout did not expose the main workspace's fixture sources or temporary JSON, preventing an otherwise valid offline test plan from proceeding.

**How to apply:** Include ready-to-return JSON responses with test instructions, and keep route interception installed before navigation. Missing fixture access must never fall back to real AI calls.
