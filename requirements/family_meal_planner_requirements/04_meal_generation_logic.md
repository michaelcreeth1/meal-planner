# 04 — Meal Generation Logic

This document defines the practical rules the app and AI should use when generating meal suggestions.

---

# Core generation goal

Generate adult meals that can be served as kid-specific, deconstructed plates while sharing as many main ingredients as possible.

The app should optimize for:

1. Shared ingredients.
2. Low prep duplication.
3. Presentation compatibility.
4. Adult meal quality.
5. Gentle exposure.
6. Low dinner conflict.

---

# Meal risk levels

## Safe

A safe meal uses mostly loved or accepted foods in accepted formats.

Characteristics:

- Minimal novelty.
- Components can be separated.
- At least one safe fallback is present.
- Good for stressful nights.

Example:

Adult: burgers with roasted potatoes and salad.

Kid plate: burger patty, bun, potatoes, cucumber, fruit.

## Bridge

A bridge meal uses accepted foods plus one small adjacent novelty.

Characteristics:

- Most of the plate is familiar.
- One tiny exposure is suggested.
- Adult version is meaningfully more interesting.
- Good default recommendation.

Example:

Adult: chicken tacos with avocado, salsa, lime crema.

Kid plate: tortilla, plain chicken, cheese, avocado. Tiny try: touch or smell salsa.

## Stretch

A stretch meal asks more of the child but still provides a workable plate.

Characteristics:

- Familiar base plus more adventurous flavor or format.
- Requires careful fallback.
- Should not be suggested too often.

Example:

Adult: chicken curry bowls.

Kid plate: rice, plain chicken pulled before curry, cucumber, tiny try of curry sauce.

## Adult-forward

An adult-forward meal prioritizes the adult meal but still derives a reasonable kid plate.

Characteristics:

- Adult dish may be saucy, mixed, spicy, or complex.
- Kid version may rely more on safe sides.
- Useful when parents want a real dinner and accept some risk.

Example:

Adult: spicy Thai basil chicken.

Kid plate: rice, cucumber, mild chicken pulled before sauce, fruit.

---

# Meal archetypes that work well

The app should favor these archetypes because they deconstruct naturally:

## Bowls

Examples:

- Chicken shawarma bowls.
- Burrito bowls.
- Greek chicken bowls.
- Teriyaki salmon bowls.

Why they work:

- Base, protein, vegetables, sauce, and toppings can be plated separately.

## Tacos

Examples:

- Chicken tacos.
- Beef tacos.
- Fish tacos.
- Breakfast tacos.

Why they work:

- Tortilla can be safe.
- Fillings can be separated.
- Adult toppings can be added later.

## Pita or wrap plates

Examples:

- Shawarma pita plates.
- Greek meatball plates.
- Falafel-inspired plates.

Why they work:

- Bread, protein, cucumber, dip, and toppings are naturally modular.

## Pasta with sauce strategy

Examples:

- Pasta with meat sauce.
- Pesto chicken pasta.
- Buttered noodles with adult toppings.

Why they work:

- Plain pasta can be set aside.
- Sauce can be served separately.

## Sheet-pan meals

Examples:

- Sausage, potatoes, and peppers.
- Chicken thighs with carrots and potatoes.

Why they work:

- Components can be plated separately.
- Adult condiments can be added after cooking.

## Pizza with divided toppings

Examples:

- Cheese zone for kids.
- Adult half with sausage, olives, peppers, goat cheese, pesto.

Why it works:

- Same dough/sauce/cheese base can support different topping zones.

## Snack-board dinners

Examples:

- Bread, cheese, fruit, cucumber, salami, hummus, olives.

Why they work:

- Low pressure.
- Easy exposure.
- Good for chaotic nights.

---

# Shared ingredient scoring

Each generated meal should be scored for how much the adult meal overlaps with kid plates.

Suggested metric:

```text
sharedIngredientRatio = sharedComponents.count / adultMealComponents.count
```

Guideline:

- `safe`: 70–90% shared.
- `bridge`: 60–85% shared.
- `stretch`: 40–70% shared.
- `adultForward`: 25–60% shared.

Do not expose this exact score in the UI unless useful. Use it internally for ranking.

---

# Presentation compatibility scoring

A food should score higher when it is offered in a known accepted format.

Example:

Child preference:

- Food: chicken
- Accepted formats: plain, strips, nuggets
- Rejected formats: saucy, shredded, spicy

Meal component:

- "plain chicken strips" = high compatibility.
- "shredded chicken in enchilada sauce" = low compatibility.
- "mild taco chicken, sauce separate" = medium compatibility.

The app should not treat ingredient acceptance as format-independent.

---

# Bridge food logic

A bridge food is adjacent to a known accepted food.

Adjacency can be based on:

- Same ingredient, different preparation.
- Same texture, different flavor.
- Same format, different ingredient.
- Same meal archetype, new topping.
- Same dip behavior, new sauce.

Examples:

```text
Accepted: chicken nuggets
Bridge: breaded chicken cutlet
Bridge: grilled chicken strips
Stretch: chicken taco meat
Stretch: chicken shawarma
```

```text
Accepted: plain noodles
Bridge: buttered noodles
Bridge: noodles with parmesan
Stretch: pasta with red sauce on the side
Stretch: pasta tossed with sauce
```

```text
Accepted: cucumber sticks
Bridge: raw bell pepper strips
Bridge: carrots with dip
Stretch: cucumber tomato salad
```

---

# Tiny exposure rules

Tiny exposures should be:

- Optional.
- Small.
- Specific.
- Low-pressure.
- Paired with safe foods when possible.

Good examples:

- "Put one pepper strip on the plate, no requirement to eat it."
- "Dip one corner of pita in yogurt sauce."
- "Smell the salsa."
- "Touch one tomato piece with a fork."
- "One tiny broccoli tree next to the rice."

Bad examples:

- "Make them eat three bites."
- "Hide vegetables in the sauce."
- "Require a clean plate."
- "Withhold dessert until they try it."

The app should avoid coercive feeding language.

---

# Prep strategy patterns

The app should generate concrete parent actions.

## Pull before sauce

Use when adult meal includes sauce, spice, or mixing.

Examples:

- Pull plain chicken before adding curry sauce.
- Set aside beef before adding stir-fry sauce.
- Reserve pasta before tossing with pesto.

## Toppings separate

Use when adult meal gets flavor from toppings.

Examples:

- Serve pickled onions, herbs, hot sauce, feta, olives, salsa, crema separately.

## Dip on side

Use when child may accept sauce as optional dip.

Examples:

- Yogurt sauce in a dip cup.
- Marinara on the side.
- Soy sauce dip.

## Raw vs cooked split

Use when children prefer raw vegetables or reject cooked textures.

Examples:

- Adults get cooked peppers and onions.
- Kids get raw pepper strips or cucumber sticks.

## Divided cooking zone

Use for pizza, sheet pans, and griddle meals.

Examples:

- Cheese-only section of pizza.
- Mild side of sheet pan.
- Separate sausage from peppers.

---

# Ranking generated meals

Meal suggestions should be ranked by a weighted score.

Suggested factors:

```text
score =
  sharedIngredientFit * 0.30 +
  childCompatibility * 0.30 +
  parentInterest * 0.15 +
  prepSimplicity * 0.15 +
  exposureQuality * 0.10
```

Where:

- `sharedIngredientFit`: How much adult and kid meals overlap.
- `childCompatibility`: How many kid components are accepted or adjacent.
- `parentInterest`: Whether the adult meal is appealing and non-bland.
- `prepSimplicity`: Whether one cooking flow supports all plates.
- `exposureQuality`: Whether the meal includes a sensible tiny try.

---

# Repetition and burnout

The app should track recent meals and avoid overusing the same safe foods.

Potential logic:

- If a food appears 4+ times in 7 days, mark as high repetition.
- If a child moves from accepted to refused repeatedly, suggest pause.
- If a food is marked burned out, avoid it unless explicitly requested.

Example UI insight:

> Rice has appeared in four recent dinners. Consider potatoes, pita, noodles, or tortillas this week.

---

# Hard constraints

The generator must obey:

- Allergies.
- Dietary restrictions.
- User-specified avoid ingredients.
- Child hard-no foods, except as explicit stretch exposure if allowed.

The generator should never suggest:

- Hidden-food strategies as the main approach.
- Coercive feeding tactics.
- Punishment or reward mechanics tied to eating.

---

# Example generated meal reasoning

Meal:

> Sausage, peppers, onions, and rice bowls.

Why it fits:

- Rice is accepted by both kids.
- Sausage can be served as separate slices.
- Adults get peppers, onions, hot sauce, and herbs.
- Kids can get raw pepper strips instead of cooked peppers.
- Prep is shared because sausage and rice are common components.

Prep strategy:

- Cook sausage separately from peppers if possible.
- Keep rice plain.
- Plate kid sausage before combining adult bowl.
- Offer one pepper strip as tiny exposure.
