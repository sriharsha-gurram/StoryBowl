---
name: Offline regression checks
description: Why StoryBowl interaction regression checks use deterministic API and narration substitutes.
---
Keep repeatable frontend regression checks offline, with deterministic generation responses and controlled speech events. Unexpected network attempts must fail, even if application error handling catches the original network exception.

**Why:** The assigned interaction-check requirements explicitly prohibit spending Groq credits or requiring secrets. Real device voices and autoplay timing also make routine checks nondeterministic.

**How to apply:** Preserve this safety constraint when expanding checks or changing their tooling. DOM simulations verify composition and event/state wiring, not actual drag geometry, autoplay policy, or audible voice quality; assess those separately with targeted browser/device checks.
