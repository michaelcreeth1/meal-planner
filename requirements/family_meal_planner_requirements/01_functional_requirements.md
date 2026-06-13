# 01 — Functional Requirements

## Requirement conventions

- `FR` = Functional requirement.
- `NFR` = Non-functional requirement.
- `AI` = AI-specific requirement.
- `UX` = User experience requirement.
- `DATA` = Data requirement.

Priority levels:

- `P0` = Required for MVP.
- `P1` = Required for strong v1.
- `P2` = Later enhancement.

---

# 1. Child profiles

## FR-001 — Create child profile

Priority: P0

The app shall allow the user to create one or more child profiles.

Each child profile shall include:

- Display name.
- Optional age.
- Optional notes.
- Default plating preference.
- Optional dietary restrictions/allergies.

## FR-002 — Edit child profile

Priority: P0

The app shall allow the user to edit a child profile after creation.

## FR-003 — Archive child profile

Priority: P1

The app shall allow the user to archive a child profile without deleting historical meal results.

---

# 2. Food preference tracking

## FR-010 — Add food preference

Priority: P0

The app shall allow the user to add a food preference for each child.

A food preference shall include:

- Food name.
- Preference status.
- Accepted formats.
- Rejected formats.
- Notes.
- Tags.
- Last offered date.
- Optional burnout flag.

## FR-011 — Food preference statuses

Priority: P0

The app shall support these food statuses:

- `loved`
- `accepted`
- `sometimes`
- `tinyTry`
- `rejected`
- `burnedOut`
- `unknown`

## FR-012 — Presentation-specific preferences

Priority: P0

The app shall allow a food to have different accepted and rejected formats.

Example:

- Food: Chicken
- Accepted: grilled plain, nuggets, strips
- Rejected: saucy, shredded, spicy

## FR-013 — Texture and mixing preferences

Priority: P0

The app shall allow per-child notes and tags for preferences such as:

- No mixed foods.
- Sauces on side.
- Crunchy preferred.
- Soft preferred.
- Raw vegetables preferred.
- Cooked vegetables preferred.
- Mild spice only.
- Finger foods preferred.

## FR-014 — Safe fallback foods

Priority: P0

The app shall allow the user to mark foods as safe fallback foods for each child.

Safe fallback foods may be used by meal generation when risk is medium or high.

## FR-015 — Quick update from dinner result

Priority: P0

The app shall update food preference metadata after a dinner result is logged.

At minimum, the app shall update:

- Last offered date.
- Last result.
- Exposure count.
- Acceptance count.

## FR-016 — Burnout detection

Priority: P2

The app should detect when a food has been served frequently and suggest reducing its use temporarily.

---

# 3. Meal generation

## FR-020 — Generate meal suggestions

Priority: P0

The app shall allow the user to request meal suggestions based on:

- Child food preferences.
- Available ingredients.
- Parent constraints.
- Desired number of meals.
- Cooking time.
- Risk level.
- Recently served meals.

## FR-021 — Adult meal and kid versions

Priority: P0

Each generated meal shall include:

- Adult meal name.
- Adult meal summary.
- Shared components.
- Adult-only components.
- Kid-specific plates.
- Prep strategy.
- Tiny exposure suggestions.
- Risk level.
- Why it fits.

## FR-022 — Kid-specific plates

Priority: P0

For each generated meal, the app shall generate a separate kid plate for each active child profile.

Each kid plate shall include:

- Child name or ID.
- Plate components.
- Sauce/dip instructions.
- Optional fallback.
- Optional tiny exposure.
- Notes explaining the reasoning.

## FR-023 — Deconstructed meal support

Priority: P0

The app shall prefer meals that can be naturally served as separate components when a child profile indicates low mixing tolerance.

Examples:

- Bowls.
- Tacos.
- Pita plates.
- Pasta with sauce on side.
- Sheet-pan meals with components separated.
- Burgers.
- Snack-board dinners.
- Divided pizza toppings.

## FR-024 — Prep strategy

Priority: P0

The app shall provide preparation instructions that help parents avoid cooking separate meals.

Examples:

- Pull plain chicken before adding sauce.
- Set aside plain pasta before tossing with pesto.
- Keep toppings in separate bowls.
- Serve adult sauce as a dip for children.
- Roast spicy components separately.

## FR-025 — Risk levels

Priority: P0

The app shall assign each generated meal one of these risk levels:

- `safe`
- `bridge`
- `stretch`
- `adultForward`

## FR-026 — Explain why a meal fits

Priority: P0

The app shall explain why each generated meal is appropriate for the family profile.

The explanation should reference:

- Accepted foods used.
- Foods presented in tolerated formats.
- Novel foods limited to small exposures.
- Shared ingredients.
- Any prep tricks that reduce conflict.

## FR-027 — Regenerate or refine meal suggestions

Priority: P1

The app should allow the user to refine generated suggestions with natural-language constraints.

Examples:

- "More Mexican-ish."
- "No rice tonight."
- "Use sausage."
- "Lower risk."
- "Make it faster."
- "More adult-interesting."

## FR-028 — Save generated meal

Priority: P0

The app shall allow the user to save a generated meal to local storage.

## FR-029 — Duplicate and edit meal

Priority: P1

The app should allow the user to duplicate and edit a saved meal.

---

# 4. Meal planning

## FR-040 — Plan multiple dinners

Priority: P0

The app shall generate a meal plan containing multiple dinners.

The user shall be able to specify:

- Number of dinners.
- Maximum cook time.
- Desired risk mix.
- Available ingredients.
- Ingredients to avoid.
- Repetition constraints.

## FR-041 — Avoid recent repetition

Priority: P1

The app should avoid suggesting the same core foods or meal archetypes too many times in a short period.

## FR-042 — Meal plan editing

Priority: P1

The user should be able to remove, replace, or regenerate individual meals in a plan.

## FR-043 — Calendar assignment

Priority: P2

The user may assign meals to specific dates.

---

# 5. Ingredient and pantry input

## FR-050 — Available ingredient input

Priority: P0

The app shall let the user enter available ingredients as free text.

Example:

> chicken thighs, tortillas, cucumbers, rice, sausage, pasta, goat cheese, pesto

## FR-051 — Ingredient parsing

Priority: P1

The app should parse free-text ingredients into structured ingredient names.

## FR-052 — Ingredient reuse

Priority: P1

Meal generation should prefer using available ingredients when provided.

---

# 6. Dinner result logging

## FR-060 — Log dinner result

Priority: P0

The app shall allow the user to log how dinner went for each child and each relevant component.

## FR-061 — Fast outcome buttons

Priority: P0

The logging UI shall support fast outcome buttons:

- Ate happily.
- Ate some.
- Tiny try.
- Touched/smelled/licked.
- Refused.
- Meltdown.
- Not offered.

## FR-062 — Notes

Priority: P0

The app shall allow optional notes for each dinner result.

## FR-063 — Update food trajectory

Priority: P1

The app should summarize foods that are improving, stagnant, rejected repeatedly, or possibly burned out.

---

# 7. Shopping list

## FR-070 — Generate shopping list

Priority: P0

The app shall generate a consolidated shopping list from selected meals.

## FR-071 — Shopping list categories

Priority: P0

Shopping list items shall be grouped into categories:

- Produce.
- Meat/seafood.
- Dairy.
- Pantry.
- Frozen.
- Bakery.
- Kid-safe fallback items.
- Optional adult upgrades.

## FR-072 — Editable shopping list

Priority: P1

The user should be able to add, remove, and check off shopping list items.

---

# 8. Saved meals and history

## FR-080 — Saved meal library

Priority: P0

The app shall provide a saved meal library.

## FR-081 — Meal outcome history

Priority: P0

Saved meals shall display prior dinner outcomes.

## FR-082 — Worked well marker

Priority: P1

The user should be able to mark a meal as "worked well."

## FR-083 — Retry later marker

Priority: P1

The user should be able to mark a meal or food as "retry later."

---

# 9. AI behavior

## AI-001 — Structured AI input

Priority: P0

The AI service shall receive structured context containing:

- Child profiles.
- Food preferences.
- Parent constraints.
- Available ingredients.
- Recent meal history.
- Desired output count.

## AI-002 — Structured AI output

Priority: P0

The AI service shall return valid JSON conforming to app-defined schemas.

## AI-003 — No direct UI dependency

Priority: P0

The AI service shall be abstracted behind a protocol so that mock and real implementations can be swapped.

## AI-004 — Avoid unsafe allergy suggestions

Priority: P0

The AI shall never suggest foods marked as allergies or hard dietary restrictions.

## AI-005 — Respect hard no foods

Priority: P0

The AI shall not include hard no foods on a child plate unless the user explicitly requests stretch suggestions.

## AI-006 — Prefer adult flavor through add-ons

Priority: P0

The AI should prefer meals where adult flavor is added through toppings, sauces, herbs, spice, acid, or finishing steps after kid portions are separated.

---

# 10. Non-functional requirements

## NFR-001 — Local-first storage

Priority: P0

The app shall store user data locally using SwiftData for MVP.

## NFR-002 — Privacy

Priority: P0

The app shall treat child food profiles and meal history as private family data.

## NFR-003 — Fast input

Priority: P0

Common logging actions shall be completable in under 30 seconds.

## NFR-004 — Offline access

Priority: P1

Saved profiles, saved meals, and meal history should be accessible offline.

## NFR-005 — AI failure handling

Priority: P0

If AI generation fails, the app shall show a clear error and allow retry.

## NFR-006 — Deterministic mock mode

Priority: P0

The app shall include a mock AI service for development and previews.
