# 08 — Codex Handoff

Use this file as the initial implementation prompt for Codex.

---

# Build request

Build an iPhone app using SwiftUI and SwiftData called **Family Meal Planner**.

The app helps parents of picky eaters plan adult meals that can be translated into kid-specific, deconstructed plates using shared ingredients.

The app is not primarily a recipe database. It is a meal planning and meal translation assistant.

---

# Core user story

As a parent,
I want to track what each child currently accepts, rejects, and tolerates by format,
so that the app can suggest adult meals with simple kid versions that share the same ingredients.

---

# Required MVP features

Implement these features first:

1. Create and edit child profiles.
2. Track food preferences per child.
3. Generate meal suggestions using a mock AI service.
4. Display adult meal plus kid-specific deconstructed plates.
5. Save meals.
6. Log dinner results with quick tap controls.
7. Update basic food preference counters after logging.
8. Generate a categorized shopping list from selected meals.

---

# Technical requirements

Use:

- SwiftUI.
- SwiftData.
- Local-only persistence.
- `NavigationStack`.
- Async service abstraction for AI.
- Mock AI implementation for MVP.

Do not require:

- Backend.
- Login.
- Cloud sync.
- Real LLM API key.
- Recipe database.

---

# Suggested project structure

```text
FamilyMealPlanner/
  App/
    FamilyMealPlannerApp.swift
  Models/
    ChildProfile.swift
    FoodPreference.swift
    Meal.swift
    MealComponent.swift
    KidPlate.swift
    DinnerResult.swift
    FoodExposureResult.swift
    ShoppingList.swift
    PlanningConstraints.swift
    Enums.swift
  Services/
    MealAIService.swift
    MockMealAIService.swift
    MealValidationService.swift
    ShoppingListBuilder.swift
    FoodPreferenceUpdater.swift
  Views/
    HomeView.swift
    Children/
      ChildListView.swift
      ChildDetailView.swift
      ChildEditorView.swift
      FoodPreferenceEditorView.swift
    Meals/
      MealGeneratorView.swift
      MealSuggestionListView.swift
      MealCardView.swift
      MealDetailView.swift
      KidPlateCardView.swift
    Logging/
      DinnerResultLoggerView.swift
      OutcomeButtonRow.swift
    Shopping/
      ShoppingListView.swift
  ViewModels/
    MealGeneratorViewModel.swift
    DinnerResultLoggerViewModel.swift
    ShoppingListViewModel.swift
  SampleData/
    SampleFamilyData.swift
```

---

# Core enums

Implement these enums:

```swift
enum FoodPreferenceStatus: String, Codable, CaseIterable {
    case loved
    case accepted
    case sometimes
    case tinyTry
    case rejected
    case burnedOut
    case unknown
}

enum FoodTag: String, Codable, CaseIterable {
    case protein
    case carb
    case vegetable
    case fruit
    case dairy
    case sauce
    case dip
    case crunchy
    case soft
    case spicy
    case sweet
    case plain
    case mixed
    case fingerFood
    case raw
    case cooked
    case topping
    case fallback
}

enum PlatingPreference: String, Codable, CaseIterable {
    case separateComponents
    case saucesOnSide
    case mixedOkay
    case fingerFoods
    case noPreference
}

enum MealRiskLevel: String, Codable, CaseIterable {
    case safe
    case bridge
    case stretch
    case adultForward
}

enum DinnerOutcome: String, Codable, CaseIterable {
    case ateHappily
    case ateSome
    case tinyTry
    case touchedSmelledLicked
    case refused
    case meltdown
    case notOffered
}

enum MealArchetype: String, Codable, CaseIterable {
    case bowl
    case taco
    case pitaPlate
    case wrap
    case pasta
    case sheetPan
    case burger
    case pizza
    case snackBoard
    case skewer
    case breakfastForDinner
    case stirFry
    case soup
    case other
}
```

---

# SwiftData model requirements

Create SwiftData models for:

- `ChildProfile`
- `FoodPreference`
- `Meal`
- `MealComponent`
- `KidPlate`
- `DinnerResult`
- `FoodExposureResult`
- `ShoppingList`
- `ShoppingListItem`

Use raw string storage for enum properties to avoid SwiftData enum persistence issues.

Example:

```swift
var statusRaw: String

var status: FoodPreferenceStatus {
    get { FoodPreferenceStatus(rawValue: statusRaw) ?? .unknown }
    set { statusRaw = newValue.rawValue }
}
```

---

# AI service requirements

Define:

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

For MVP, implement `MockMealAIService`.

The mock service should return deterministic suggestions based on available ingredients:

- Contains chicken + rice: return Chicken Shawarma Rice Bowls.
- Contains tortillas: return Chicken Taco Plates.
- Contains pasta: return Pasta with Sauce on the Side.
- Contains sausage: return Sausage Rice Bowls.
- Otherwise: return Snack Board Dinner.

Each mock meal must include:

- Adult summary.
- Risk level.
- Archetype.
- Why it fits.
- Shared components.
- Adult-only components.
- Prep strategy.
- One kid plate per child.

---

# UI requirements

## HomeView

Show primary actions:

- Plan this week.
- Use ingredients I have.
- Make kid versions of a meal.
- View food profiles.
- Saved meals.

## ChildListView

Show active children and add button.

## ChildDetailView

Show foods grouped by status:

- Loved.
- Accepted.
- Sometimes.
- Tiny Try.
- Rejected.
- Burned Out.
- Unknown.

Show child preferences and notes.

## FoodPreferenceEditorView

Fields:

- Food name.
- Status picker.
- Accepted formats.
- Rejected formats.
- Tags.
- Safe fallback toggle.
- Hard no toggle.
- Notes.

## MealGeneratorView

Inputs:

- Number of meals.
- Max cook time.
- Risk level selection.
- Available ingredients free text.
- Avoid ingredients free text.
- Parent notes.

Button:

- Generate meals.

## MealSuggestionListView

Show generated meal cards.

## MealCardView

Display:

- Name.
- Risk level.
- Cook time.
- Adult summary.
- Why it fits.
- Kid plate summary.
- Prep trick.

Actions:

- Save.
- View detail.

## MealDetailView

Display:

- Adult meal.
- Shared components.
- Adult-only components.
- Kid plates.
- Prep strategy.
- Optional adult upgrades.
- Log result button.
- Generate shopping list button.

## DinnerResultLoggerView

For each child and component, show outcome buttons:

- Ate happily.
- Ate some.
- Tiny try.
- Touched/smelled/licked.
- Refused.
- Meltdown.
- Not offered.

Save result and update food preference counters.

## ShoppingListView

Display categorized items with checkboxes.

---

# Sample data requirement

Include sample profiles so the app is useful in previews.

Sample child 1:

- Accepted: rice, plain chicken, cucumber, pita.
- Rejected: tomato, spicy sauce.
- Preference: separate components, sauces on side.

Sample child 2:

- Accepted: rice, pita, fruit.
- Tiny try: chicken, yogurt sauce.
- Rejected: mixed saucy foods.
- Preference: no mixed foods.

---

# Important product behavior

The app should not generate generic kid meals as the main output.

Every meal suggestion should be structured like:

1. Adult meal.
2. Kid 1 plate.
3. Kid 2 plate.
4. Shared ingredients.
5. Adult-only additions.
6. Prep strategy.
7. Tiny exposure.
8. Why it fits.

---

# Initial mock meal example

```swift
Meal(
    name: "Chicken Shawarma Rice Bowls",
    adultSummary: "Mildly spiced chicken over rice with cucumber, pita, yogurt sauce, herbs, and pickled onions.",
    archetype: .bowl,
    riskLevel: .bridge,
    whyItFits: "Uses accepted foods like chicken, rice, cucumber, and pita. Adult flavor comes from toppings and sauce served separately.",
    prepStrategy: [
        "Cook chicken mildly and pull kid portions before adding extra spice.",
        "Serve yogurt sauce in a dip cup.",
        "Keep adult toppings separate."
    ],
    sharedComponents: ["chicken", "rice", "cucumber", "pita"],
    adultOnlyComponents: ["pickled onions", "herbs", "hot sauce"],
    optionalAdultUpgrades: ["feta", "sumac onions"]
)
```

---

# Definition of done

The implementation is acceptable when:

1. The app builds and runs on iPhone simulator.
2. Sample data appears on first launch or in previews.
3. User can create children and food preferences.
4. User can generate mocked meal suggestions.
5. Generated meals include kid plates for all active children.
6. User can save a meal.
7. User can log a dinner result.
8. Food exposure counters update after logging.
9. User can generate and check off a shopping list.
10. All data persists locally after app restart.
