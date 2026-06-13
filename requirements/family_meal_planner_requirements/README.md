# Family Meal Planner for Picky Eaters — Requirements Packet

This packet defines the requirements for an iPhone app that helps parents plan family meals when children are picky, prefer deconstructed plates, and need gradual exposure to new foods.

The product is not primarily a recipe app. It is a **family meal translation assistant**: it helps adults eat real meals while generating simplified kid versions from the same core ingredients.

## Core product thesis

Parents do not need more generic kid-friendly recipes. They need help answering:

> What can the adults eat tonight that lets me plate safe, deconstructed, low-conflict versions for each kid without cooking two separate dinners?

The app should track each child's accepted foods, rejected foods, tolerated formats, texture preferences, sauce/mixing tolerance, and exposure history. AI is used to suggest adult meals, kid plates, prep strategies, and gentle exposure steps.

## Files in this packet

1. `00_product_brief.md` — Product vision, target users, core principles, success criteria.
2. `01_functional_requirements.md` — Codex-ready functional requirements with IDs.
3. `02_data_model.md` — SwiftData-oriented domain model and entity definitions.
4. `03_ai_contract.md` — AI service abstraction, prompt inputs, JSON output schemas, validation rules.
5. `04_meal_generation_logic.md` — Meal scoring, risk levels, bridge logic, deconstruction strategy.
6. `05_ux_flows.md` — Core screens, flows, and interaction details.
7. `06_mvp_scope.md` — MVP, v1, v2, and explicit non-goals.
8. `07_acceptance_criteria.md` — Testable acceptance criteria and sample scenarios.
9. `08_codex_handoff.md` — Implementation instructions suitable for Codex.

## Recommended build approach

Start with a local-only SwiftUI + SwiftData app. Mock the AI service with deterministic sample JSON until the data model and UI flows are stable. Then swap in a real LLM-backed service behind the same protocol.

Recommended implementation phases:

1. Build local models and profile editor.
2. Build manual meal cards and kid plate display.
3. Add mocked meal generation.
4. Add dinner result logging and food preference updates.
5. Add shopping list generation.
6. Add real AI service.

## Product language

Use gentle, parent-friendly language. Avoid making the app feel clinical, judgmental, or gamified in a way that pressures children.

Preferred terms:

- `Tiny Try` instead of `Failure` or `Refused Challenge`
- `Bridge Meal` instead of `Picky Eater Meal`
- `Safe Food` instead of `Crutch Food`
- `Adult Additions` instead of `Kid Exclusions`
- `Prep Trick` instead of `Hack`
