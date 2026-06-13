# 03 — AI Contract

The AI layer must be structured and swappable. The UI should never depend directly on a specific LLM SDK.

---

# AI service protocol

Suggested Swift protocol:

```swift
protocol MealAIService {
    func generateMealSuggestions(
        request: MealGenerationRequest
    ) async throws -> MealGenerationResponse

    func generateKidPlates(
        request: KidPlateGenerationRequest
    ) async throws -> KidPlateGenerationResponse

    func generateShoppingList(
        request: ShoppingListGenerationRequest
    ) async throws -> ShoppingListResponse
}
```

Implementations:

- `MockMealAIService` for local development and previews.
- `LLMMealAIService` for real model calls.

---

# Design rule

The app should send structured context and receive structured JSON.

Avoid unstructured chat responses in production app flows.

---

# MealGenerationRequest

```json
{
  "family": {
    "children": [
      {
        "id": "UUID",
        "name": "Kid 1",
        "age": 5,
        "defaultPlatingPreference": "separateComponents",
        "allergiesOrRestrictions": [],
        "foodPreferences": [
          {
            "foodName": "chicken",
            "status": "accepted",
            "acceptedFormats": ["plain grilled", "strips", "nuggets"],
            "rejectedFormats": ["saucy", "spicy", "mixed into pasta"],
            "tags": ["protein", "plain"],
            "isSafeFallback": false,
            "isHardNo": false,
            "notes": "Works best if served separately."
          }
        ]
      }
    ]
  },
  "constraints": {
    "numberOfMeals": 4,
    "maxCookTimeMinutes": 45,
    "availableIngredients": ["chicken thighs", "rice", "cucumber", "tortillas"],
    "avoidIngredients": [],
    "desiredRiskLevels": ["safe", "bridge"],
    "parentPreferences": ["savory", "adult-interesting", "not bland"],
    "recentMealNames": ["burgers", "plain pasta"],
    "notes": "Prefer meals where adult flavor comes from toppings or sauce added after plating."
  }
}
```

---

# MealGenerationResponse

```json
{
  "meals": [
    {
      "name": "Chicken Shawarma Rice Bowls",
      "adultSummary": "Mildly spiced chicken over rice with cucumber, pita, yogurt sauce, herbs, and pickled onions.",
      "archetype": "bowl",
      "riskLevel": "bridge",
      "estimatedCookTimeMinutes": 40,
      "whyItFits": "Uses accepted foods like chicken, rice, cucumber, and pita. Adult flavor comes from toppings and sauce served separately.",
      "sharedComponents": ["chicken", "rice", "cucumber", "pita"],
      "adultOnlyComponents": ["pickled onions", "herbs", "hot sauce"],
      "optionalAdultUpgrades": ["feta", "sumac onions"],
      "prepStrategy": [
        "Cook chicken mildly and pull kid portions before adding extra spice.",
        "Serve yogurt sauce in a dip cup.",
        "Keep adult toppings separate."
      ],
      "components": [
        { "name": "chicken", "role": "shared", "tags": ["protein"], "notes": "Pull some before extra spice." },
        { "name": "rice", "role": "shared", "tags": ["carb"], "notes": "Serve plain for kids." },
        { "name": "pickled onions", "role": "adultOnly", "tags": ["topping"], "notes": "Optional adult topping." }
      ],
      "kidPlates": [
        {
          "childProfileID": "UUID",
          "childName": "Kid 1",
          "plateComponents": ["plain chicken pieces", "rice", "cucumber sticks", "pita"],
          "sauceInstructions": "Yogurt sauce on the side as optional dip.",
          "fallbackComponents": ["fruit"],
          "tinyTry": "Dip one corner of pita in yogurt sauce.",
          "reasoning": "Matches accepted plain chicken, rice, cucumber, and separated components."
        }
      ]
    }
  ]
}
```

---

# KidPlateGenerationRequest

Used when the user enters an adult meal and asks the app to make kid versions.

```json
{
  "adultMeal": {
    "name": "Beef and Broccoli Stir Fry",
    "summary": "Beef and broccoli in savory sauce over rice.",
    "components": ["beef", "broccoli", "rice", "soy sauce", "garlic", "ginger"]
  },
  "children": [
    {
      "id": "UUID",
      "name": "Kid 1",
      "defaultPlatingPreference": "separateComponents",
      "foodPreferences": []
    }
  ]
}
```

# KidPlateGenerationResponse

```json
{
  "adultMealName": "Beef and Broccoli Stir Fry",
  "prepStrategy": [
    "Set aside plain rice for kids.",
    "Cook a few beef strips with minimal sauce before combining the rest with broccoli.",
    "Serve broccoli separately as a tiny try."
  ],
  "kidPlates": [
    {
      "childProfileID": "UUID",
      "childName": "Kid 1",
      "plateComponents": ["rice", "plain beef strips"],
      "sauceInstructions": "Small soy sauce dip on the side if tolerated.",
      "fallbackComponents": ["cucumber", "fruit"],
      "tinyTry": "One small broccoli tree on the plate, no pressure.",
      "reasoning": "Rice is safe. Beef is offered separately before saucing. Broccoli is exposure only."
    }
  ]
}
```

---

# ShoppingListGenerationRequest

```json
{
  "meals": [
    {
      "name": "Chicken Shawarma Rice Bowls",
      "components": ["chicken", "rice", "cucumber", "pita", "Greek yogurt", "herbs", "pickled onions"]
    }
  ],
  "availableIngredients": ["rice", "cucumber"]
}
```

# ShoppingListResponse

```json
{
  "items": [
    {
      "name": "chicken thighs",
      "category": "meatSeafood",
      "quantity": "1.5 lb",
      "sourceMealName": "Chicken Shawarma Rice Bowls",
      "isOptionalAdultUpgrade": false,
      "isKidFallback": false
    },
    {
      "name": "pickled onions",
      "category": "optionalAdultUpgrades",
      "quantity": null,
      "sourceMealName": "Chicken Shawarma Rice Bowls",
      "isOptionalAdultUpgrade": true,
      "isKidFallback": false
    }
  ]
}
```

---

# Prompting requirements

The system prompt for the meal generator should enforce the product philosophy.

Suggested prompt skeleton:

```text
You are a family meal planning assistant for parents of picky eaters.

Your goal is to suggest adult meals that can be translated into kid-specific, deconstructed plates using shared ingredients.

Rules:
- Do not suggest generic kid meals unless requested.
- Prefer adult meals where flavor can be added through sauces, toppings, herbs, spices, acid, or finishing steps after kid portions are separated.
- Respect each child's accepted foods, rejected foods, accepted formats, rejected formats, plating preferences, allergies, and hard no foods.
- For children who dislike mixed foods, suggest separated components.
- Include tiny exposure suggestions that are low-pressure and optional.
- Include prep strategies such as pulling portions before saucing or keeping toppings separate.
- Never include allergens or dietary restrictions.
- Return only valid JSON matching the provided schema.
```

---

# Validation rules

The app should validate AI output before saving.

Validation requirements:

1. Response must parse as JSON.
2. Required fields must exist.
3. `riskLevel` must match known enum values.
4. Every active child must have a kid plate for each meal.
5. No kid plate may include allergy/restriction foods.
6. No hard-no food may appear on a kid plate unless the risk level is `stretch` or `adultForward` and the item is explicitly a tiny exposure.
7. If validation fails, show a recoverable error and allow regeneration.

---

# AI safety and privacy requirements

- Do not send unnecessary personal information to the AI service.
- Send child display names only if needed; otherwise use pseudonymous labels.
- Do not send sensitive notes unless relevant to meal planning.
- Allergies and dietary restrictions must be included because they affect safety.
- Store AI responses locally only after validation.

---

# Mock AI response requirement

For MVP development, create deterministic sample responses.

Example mock function behavior:

- If available ingredients include `chicken` and `rice`, return Chicken Shawarma Rice Bowls.
- If available ingredients include `pasta`, return Pasta with Sauce on the Side.
- If available ingredients include `tortillas`, return Taco Plates.
- Otherwise return a generic Snack Board Dinner.

This allows the UI to be built without a real API key.
