# 07 — Acceptance Criteria

This document defines testable behaviors for the app.

---

# Child profiles

## AC-001 — Create child profile

Given the user is on the child list screen,
when the user taps `Add Child`, enters a name, and saves,
then a new child profile appears in the child list.

## AC-002 — Edit child profile

Given a child profile exists,
when the user edits the child's name or default plating preference and saves,
then the updated values persist after app restart.

## AC-003 — Archive child profile

Given a child profile exists,
when the user archives it,
then the child no longer appears in active meal generation,
but historical dinner results remain visible.

---

# Food preferences

## AC-010 — Add food preference

Given a child profile exists,
when the user adds a food preference with food name, status, formats, and notes,
then the food appears in the child's profile grouped by status.

## AC-011 — Presentation-specific preference

Given a food preference for chicken has accepted format `plain strips` and rejected format `saucy`,
when meal generation uses chicken,
then suggestions should prefer plain or separable chicken for that child.

## AC-012 — Safe fallback

Given a food is marked as a safe fallback,
when a generated meal has risk level `stretch` or `adultForward`,
then the kid plate should include or suggest a fallback component.

## AC-013 — Hard no

Given a food is marked as hard no for a child,
when meals are generated,
then that food should not appear on that child's plate except as an explicitly labeled tiny exposure in an allowed stretch context.

## AC-014 — Allergy or dietary restriction

Given a child's profile lists a food as an allergy or dietary restriction,
when meals are generated,
then that food must not appear anywhere in that child's meal suggestion.

---

# Meal generation

## AC-020 — Generate meal suggestions

Given at least one active child profile with food preferences,
when the user requests meal suggestions,
then the app displays at least one meal card with:

- Meal name.
- Adult summary.
- Risk level.
- Why it fits.
- Kid plates.
- Prep strategy.

## AC-021 — Every child gets a plate

Given there are two active child profiles,
when meal suggestions are generated,
then each suggested meal includes one kid plate for each child.

## AC-022 — Deconstructed plates for separate-component child

Given a child has default plating preference `separateComponents`,
when a meal is generated,
then that child's plate lists separate components rather than a combined dish.

## AC-023 — Sauce on side

Given a child has a note or preference indicating sauces should be on the side,
when a meal includes sauce,
then the child's plate should either omit the sauce or include it as an optional side dip.

## AC-024 — Adult flavor through toppings

Given the parent requests adult-interesting meals and kids need low-risk plates,
when meals are generated,
then at least some suggestions should use adult-only toppings, sauces, herbs, spice, or finishing elements.

## AC-025 — Prep strategy is actionable

Given a generated meal includes a sauced or spiced adult component,
when the meal detail is shown,
then the prep strategy should include a concrete action such as pulling kid portions before saucing or keeping toppings separate.

## AC-026 — Risk level visible

Given meal suggestions are displayed,
then each meal card shows risk level as one of:

- Safe.
- Bridge.
- Stretch.
- Adult-forward.

---

# Meal planning

## AC-030 — Generate multiple dinners

Given the user requests four dinners,
when generation succeeds,
then the app displays four meal suggestions or clearly explains if fewer were generated.

## AC-031 — Available ingredients used

Given the user enters available ingredients,
when meals are generated,
then the suggestions should prioritize those ingredients and identify shared components.

## AC-032 — Avoid ingredients respected

Given the user enters an ingredient to avoid,
when meals are generated,
then that ingredient should not appear in generated meals.

---

# Saved meals

## AC-040 — Save generated meal

Given a generated meal is displayed,
when the user taps `Save`,
then the meal appears in the saved meal library.

## AC-041 — Saved meal persists

Given a meal has been saved,
when the app is restarted,
then the saved meal remains available.

## AC-042 — Meal detail

Given a saved meal exists,
when the user opens it,
then the meal detail screen shows adult meal, shared components, kid plates, prep strategy, and history.

---

# Dinner result logging

## AC-050 — Log component outcome

Given a saved meal has kid plate components,
when the user logs outcomes for each child and component,
then a dinner result is saved.

## AC-051 — Fast logging

Given a saved meal with two children and four components each,
when the user logs dinner results,
then the user should be able to complete logging using tap controls without typing.

## AC-052 — Notes optional

Given the user logs a dinner result,
when the user leaves notes blank,
then the result still saves successfully.

## AC-053 — Food counters update

Given a child has a food preference for rice,
when the user logs rice as `ateHappily`,
then rice's exposure count and accepted count increase.

## AC-054 — Not offered does not update exposure

Given a component is marked `notOffered`,
when the result is saved,
then that component's exposure count does not increase.

---

# Shopping list

## AC-060 — Generate shopping list

Given the user selects one or more meals,
when the user generates a shopping list,
then the app creates a categorized list of ingredients.

## AC-061 — Check off item

Given a shopping list item exists,
when the user taps it,
then its checked state toggles.

## AC-062 — Optional adult upgrades grouped

Given a meal includes optional adult upgrades,
when the shopping list is generated,
then those items appear in the optional adult upgrades category.

---

# AI service and validation

## AC-070 — Mock AI works without network

Given the app is running in mock mode,
when the user generates meals,
then the app returns deterministic meal suggestions without network access.

## AC-071 — Invalid JSON handled

Given the AI service returns invalid JSON,
when the app attempts to parse it,
then the app shows a recoverable error and does not save invalid data.

## AC-072 — Missing child plate rejected

Given the AI service returns a meal without a kid plate for every active child,
when validation runs,
then the response is rejected or repaired before display.

## AC-073 — Allergen validation

Given the AI response includes a restricted ingredient for a child,
when validation runs,
then the app rejects the response or removes the unsafe suggestion before display.

---

# Sample end-to-end scenario

## Scenario: Weeknight bridge meal

Initial data:

Child 1:

- Accepted: rice, plain chicken, cucumber, pita.
- Rejected: tomato, spicy sauce.
- Preference: separate components, sauces on side.

Child 2:

- Accepted: rice, pita, fruit.
- Tiny try: chicken.
- Preference: no mixed foods.

User input:

- Available ingredients: chicken thighs, rice, cucumber, pita, yogurt.
- Desired meals: 1.
- Risk: bridge.
- Max cook time: 45 minutes.

Expected output:

Meal:

- Chicken shawarma rice bowls.

Adult summary:

- Chicken over rice with cucumber, pita, yogurt sauce, herbs, and pickled onions.

Kid 1 plate:

- Plain chicken, rice, cucumber sticks, pita, yogurt sauce on side.

Kid 2 plate:

- Rice, pita, cucumber, tiny try of chicken.

Prep strategy:

- Pull kid chicken before adding extra spice.
- Keep toppings separate.
- Serve sauce as optional dip.

Risk:

- Bridge.

Pass condition:

- The meal uses shared ingredients.
- The children receive separate plates.
- The sauce is not mixed into the kid meals.
- The tiny try is optional and low-pressure.
