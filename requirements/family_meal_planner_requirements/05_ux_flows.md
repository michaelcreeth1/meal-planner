# 05 — UX Flows

The app should be optimized for tired parents making dinner decisions quickly.

Primary design goals:

- Fast input.
- Low typing after initial setup.
- Clear meal cards.
- Kid-specific plates visible at a glance.
- Logging in under 30 seconds.

---

# Navigation model

Recommended primary tabs:

1. `Plan`
2. `Meals`
3. `Kids`
4. `History`
5. `Settings`

For MVP, this can be simplified to a single `NavigationStack` starting from Home.

---

# Home screen

Purpose: quickly start the most common workflows.

Suggested layout:

```text
Family Meal Planner

What are we solving?

[Plan this week]
[Use ingredients I have]
[Make kid versions of a meal]
[What should we retry?]
[View food profiles]

Recent wins:
- Chicken pita plates worked well for both kids.
- Yogurt sauce got a tiny try.

Possible burnout:
- Rice appeared 4 times recently.
```

MVP home actions:

- Plan this week.
- Use ingredients I have.
- Make kid versions.
- View kids.

---

# Onboarding flow

Goal: create useful profiles without making onboarding too long.

## Step 1 — Create children

Fields:

- Child name.
- Optional age.
- Default plating preference.

Default plating preference options:

- Separate components.
- Sauces on side.
- Mixed okay.
- Finger foods.

## Step 2 — Add safe foods

Prompt:

> What foods are almost always safe?

Input style:

- Chips/buttons for common foods.
- Free-text entry.

Examples:

- pasta
- rice
- chicken nuggets
- plain chicken
- tortillas
- cucumber
- strawberries
- yogurt

## Step 3 — Add hard no foods

Prompt:

> Anything that usually causes trouble?

Fields:

- Food name.
- Notes.
- Hard no toggle.

## Step 4 — Add presentation notes

Prompt:

> Any patterns we should remember?

Suggested toggles:

- Does not like mixed foods.
- Sauces on side.
- Likes crunchy foods.
- Likes raw vegetables more than cooked.
- Sensitive to spice.
- Likes dipping.
- Foods cannot touch.

---

# Kids screen

Purpose: view and edit child food profiles.

Suggested layout:

```text
Kid 1

Loved
- pasta
- rice

Accepted
- plain chicken
- cucumber sticks
- tortilla

Sometimes
- cheese
- egg

Tiny Try
- yogurt sauce
- avocado

Rejected
- tomato
- saucy mixed foods

Preferences
- Separate components
- Sauces on side
- Crunchy/raw vegetables preferred

[Add food]
[Edit notes]
```

Food row actions:

- Change status.
- Add accepted format.
- Add rejected format.
- Mark safe fallback.
- Mark hard no.
- Add note.

---

# Add/edit food preference flow

Fields:

```text
Food name
Status
Tags
Accepted formats
Rejected formats
Safe fallback toggle
Hard no toggle
Notes
```

Example:

```text
Food: Chicken
Status: Accepted
Tags: Protein, Plain
Accepted formats:
- grilled plain
- nuggets
- strips
Rejected formats:
- spicy
- shredded in sauce
Notes:
- Works if separated from sauce.
```

---

# Meal generator flow

Entry points:

- Plan this week.
- Use ingredients I have.
- Make kid versions of a meal.

## Plan this week

Inputs:

```text
How many dinners?
[1] [2] [3] [4] [5]

Max cook time?
[20] [30] [45] [60] [No limit]

Risk level?
[Safe] [Bridge] [Stretch] [Mix]

Available ingredients
[free text]

Anything to avoid?
[free text]

Parent notes
[free text]
```

Primary CTA:

> Generate meals

## Use ingredients I have

Input:

```text
I have...
[chicken thighs, tortillas, cucumber, rice, sausage]
```

Optional filters:

- Fast.
- Low risk.
- More adult-interesting.
- No pasta.
- No rice.

## Make kid versions of a meal

Input:

```text
Adult meal name
Adult meal components
Notes
```

Example:

```text
Beef and broccoli stir fry
beef, broccoli, rice, soy sauce, garlic, ginger
```

CTA:

> Make kid plates

---

# Meal suggestion card

A meal card should provide enough detail to choose quickly.

Suggested card:

```text
Chicken Shawarma Rice Bowls
Bridge · 40 min · Bowl

Adult version
Chicken over rice with cucumber, pita, yogurt sauce, herbs, and pickled onions.

Why this works
Uses accepted chicken, rice, cucumber, and pita. Adult flavor comes from toppings.

Kid plates
Kid 1: chicken, rice, cucumber sticks, pita, yogurt dip on side.
Kid 2: rice, pita, cucumber, tiny try of chicken.

Prep trick
Pull kid chicken before adding extra spice.

[Save] [Add to plan] [Regenerate like this]
```

---

# Meal detail screen

Sections:

1. Header
   - Meal name.
   - Risk level.
   - Cook time.
   - Archetype.

2. Adult meal
   - Summary.
   - Adult-only additions.

3. Shared components
   - List of ingredients shared with kid plates.

4. Kid plates
   - One card per child.
   - Plate components.
   - Sauce instructions.
   - Tiny try.
   - Fallback.

5. Prep strategy
   - Step-by-step parent actions.

6. Shopping list preview
   - Ingredients.
   - Optional adult upgrades.

7. History
   - Previous results if served before.

Actions:

- Save.
- Add to meal plan.
- Generate shopping list.
- Log result.
- Edit.

---

# Dinner result logging flow

Goal: log in under 30 seconds.

Entry point:

- From saved meal.
- From meal plan.
- From history.

Screen structure:

```text
How did Chicken Shawarma Rice Bowls go?

Kid 1
Chicken     [Ate] [Some] [Tiny Try] [Touched] [Refused] [N/O]
Rice        [Ate] [Some] [Tiny Try] [Touched] [Refused] [N/O]
Cucumber    [Ate] [Some] [Tiny Try] [Touched] [Refused] [N/O]
Yogurt      [Ate] [Some] [Tiny Try] [Touched] [Refused] [N/O]

Kid 2
...

Overall
[Worked well] toggle
Notes: [optional]

[Save result]
```

Abbreviations in UI should be avoided unless space requires them. `N/O` can become `Not offered` in full.

---

# History screen

Purpose:

- Show what worked.
- Show food trends.
- Help planning avoid repetition.

Suggested sections:

```text
Recent dinners
- Chicken pita plates — worked well
- Sausage rice bowls — mixed
- Pasta with sauce side — worked well

Foods gaining traction
- yogurt sauce
- avocado

Foods to pause
- tomato
- cooked bell pepper

Often used recently
- rice
- pasta
```

---

# Shopping list screen

Generated from selected meals.

Layout:

```text
Shopping List

Produce
[ ] cucumber
[ ] bell peppers
[ ] herbs

Meat
[ ] chicken thighs
[ ] sausage

Dairy
[ ] Greek yogurt
[ ] feta

Pantry
[ ] pita
[ ] rice

Kid-safe fallback items
[ ] fruit

Optional adult upgrades
[ ] pickled onions
[ ] hot sauce
```

Actions:

- Check off item.
- Add item.
- Delete item.
- Group by category.

---

# Empty states

## No kids yet

```text
Add your first child profile so the app can generate kid-specific meal ideas.

[Add child]
```

## No food preferences yet

```text
Start with a few safe foods. You can add details later.

[Add safe foods]
```

## AI generation failed

```text
Couldn’t generate meals.

Your profiles and saved meals are still available. Try again or adjust the constraints.

[Retry]
```

---

# Tone guidelines

Use calm, non-judgmental language.

Good:

- "Tiny try"
- "This might be a good bridge"
- "No pressure exposure"
- "Safe fallback"
- "Worked well"

Avoid:

- "Failure"
- "Bad eater"
- "Make them eat"
- "Sneak vegetables"
- "Punishment"
- "Clean plate"

---

# Accessibility and usability

- Use large tap targets for logging.
- Support Dynamic Type.
- Avoid color-only status indicators.
- Make generated meal cards skimmable.
- Keep common actions within one or two taps.
- Support light and dark mode.
