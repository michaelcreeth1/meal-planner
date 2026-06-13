# 02 — Data Model

This document defines the core domain model for a SwiftUI + SwiftData implementation.

The names below are suggestions. They are designed to be Codex-friendly and can be adapted during implementation.

---

# Entity overview

Core entities:

- `ChildProfile`
- `FoodItem`
- `FoodPreference`
- `Meal`
- `MealComponent`
- `KidPlate`
- `MealPlan`
- `DinnerResult`
- `FoodExposureResult`
- `ShoppingList`
- `ShoppingListItem`
- `PlanningConstraints`

---

# Enums

## FoodPreferenceStatus

```swift
/// Child-specific relationship to a food.
enum FoodPreferenceStatus: String, Codable, CaseIterable {
    case loved
    case accepted
    case sometimes
    case tinyTry
    case rejected
    case burnedOut
    case unknown
}
```

## FoodTag

```swift
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
```

## PlatingPreference

```swift
enum PlatingPreference: String, Codable, CaseIterable {
    case separateComponents
    case saucesOnSide
    case mixedOkay
    case fingerFoods
    case noPreference
}
```

## MealRiskLevel

```swift
enum MealRiskLevel: String, Codable, CaseIterable {
    case safe
    case bridge
    case stretch
    case adultForward
}
```

## DinnerOutcome

```swift
enum DinnerOutcome: String, Codable, CaseIterable {
    case ateHappily
    case ateSome
    case tinyTry
    case touchedSmelledLicked
    case refused
    case meltdown
    case notOffered
}
```

## MealArchetype

```swift
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

# ChildProfile

Represents one child.

Suggested SwiftData model:

```swift
@Model
final class ChildProfile {
    var id: UUID
    var name: String
    var age: Int?
    var notes: String
    var isArchived: Bool
    var defaultPlatingPreferenceRaw: String
    var allergiesOrRestrictions: [String]
    var createdAt: Date
    var updatedAt: Date

    @Relationship(deleteRule: .cascade)
    var foodPreferences: [FoodPreference]

    init(
        id: UUID = UUID(),
        name: String,
        age: Int? = nil,
        notes: String = "",
        isArchived: Bool = false,
        defaultPlatingPreference: PlatingPreference = .separateComponents,
        allergiesOrRestrictions: [String] = [],
        createdAt: Date = .now,
        updatedAt: Date = .now,
        foodPreferences: [FoodPreference] = []
    ) {
        self.id = id
        self.name = name
        self.age = age
        self.notes = notes
        self.isArchived = isArchived
        self.defaultPlatingPreferenceRaw = defaultPlatingPreference.rawValue
        self.allergiesOrRestrictions = allergiesOrRestrictions
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.foodPreferences = foodPreferences
    }
}
```

Computed helper:

```swift
var defaultPlatingPreference: PlatingPreference {
    get { PlatingPreference(rawValue: defaultPlatingPreferenceRaw) ?? .separateComponents }
    set { defaultPlatingPreferenceRaw = newValue.rawValue }
}
```

---

# FoodPreference

Represents one child's relationship to one food.

```swift
@Model
final class FoodPreference {
    var id: UUID
    var foodName: String
    var statusRaw: String
    var tagsRaw: [String]
    var acceptedFormats: [String]
    var rejectedFormats: [String]
    var notes: String
    var isSafeFallback: Bool
    var isHardNo: Bool
    var lastOfferedAt: Date?
    var lastOutcomeRaw: String?
    var exposureCount: Int
    var acceptedCount: Int
    var refusedCount: Int
    var createdAt: Date
    var updatedAt: Date

    init(
        id: UUID = UUID(),
        foodName: String,
        status: FoodPreferenceStatus = .unknown,
        tags: [FoodTag] = [],
        acceptedFormats: [String] = [],
        rejectedFormats: [String] = [],
        notes: String = "",
        isSafeFallback: Bool = false,
        isHardNo: Bool = false,
        lastOfferedAt: Date? = nil,
        lastOutcome: DinnerOutcome? = nil,
        exposureCount: Int = 0,
        acceptedCount: Int = 0,
        refusedCount: Int = 0,
        createdAt: Date = .now,
        updatedAt: Date = .now
    ) {
        self.id = id
        self.foodName = foodName
        self.statusRaw = status.rawValue
        self.tagsRaw = tags.map(\.rawValue)
        self.acceptedFormats = acceptedFormats
        self.rejectedFormats = rejectedFormats
        self.notes = notes
        self.isSafeFallback = isSafeFallback
        self.isHardNo = isHardNo
        self.lastOfferedAt = lastOfferedAt
        self.lastOutcomeRaw = lastOutcome?.rawValue
        self.exposureCount = exposureCount
        self.acceptedCount = acceptedCount
        self.refusedCount = refusedCount
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}
```

Status update heuristic:

- `ateHappily` increments exposure and accepted counts.
- `ateSome` increments exposure and accepted counts.
- `tinyTry` increments exposure but not full acceptance.
- `touchedSmelledLicked` increments exposure.
- `refused` increments exposure and refused counts.
- `meltdown` increments refused count and may mark food as high-risk.
- `notOffered` does not update counters.

Do not automatically move a food from rejected to accepted after one good result. Prefer a conservative trend-based update.

---

# Meal

Represents a generated or manually created meal.

```swift
@Model
final class Meal {
    var id: UUID
    var name: String
    var adultSummary: String
    var archetypeRaw: String
    var riskLevelRaw: String
    var whyItFits: String
    var prepStrategy: [String]
    var adultOnlyComponents: [String]
    var sharedComponents: [String]
    var optionalAdultUpgrades: [String]
    var estimatedCookTimeMinutes: Int?
    var source: String // "ai", "manual", "sample"
    var createdAt: Date
    var updatedAt: Date
    var lastServedAt: Date?
    var workedWellCount: Int

    @Relationship(deleteRule: .cascade)
    var components: [MealComponent]

    @Relationship(deleteRule: .cascade)
    var kidPlates: [KidPlate]
}
```

---

# MealComponent

Represents a component or ingredient in a meal.

```swift
@Model
final class MealComponent {
    var id: UUID
    var name: String
    var role: String // "shared", "adultOnly", "kidOnly", "optional", "fallback"
    var tagsRaw: [String]
    var notes: String
}
```

---

# KidPlate

Represents a child-specific version of a meal.

```swift
@Model
final class KidPlate {
    var id: UUID
    var childProfileID: UUID
    var childNameSnapshot: String
    var plateComponents: [String]
    var sauceInstructions: String
    var fallbackComponents: [String]
    var tinyTry: String
    var reasoning: String
    var notes: String
}
```

Use `childNameSnapshot` so historical meals remain understandable if a profile is renamed.

---

# MealPlan

Represents a multi-meal plan.

```swift
@Model
final class MealPlan {
    var id: UUID
    var title: String
    var startDate: Date?
    var notes: String
    var createdAt: Date
    var updatedAt: Date

    @Relationship
    var meals: [Meal]
}
```

---

# DinnerResult

Represents the result of serving a meal.

```swift
@Model
final class DinnerResult {
    var id: UUID
    var mealID: UUID?
    var mealNameSnapshot: String
    var servedAt: Date
    var overallNotes: String
    var workedWell: Bool
    var createdAt: Date

    @Relationship(deleteRule: .cascade)
    var exposureResults: [FoodExposureResult]
}
```

---

# FoodExposureResult

Represents one child's result for one component or food during a dinner.

```swift
@Model
final class FoodExposureResult {
    var id: UUID
    var childProfileID: UUID
    var childNameSnapshot: String
    var foodName: String
    var format: String
    var outcomeRaw: String
    var notes: String
}
```

---

# ShoppingList

```swift
@Model
final class ShoppingList {
    var id: UUID
    var title: String
    var createdAt: Date
    var updatedAt: Date

    @Relationship(deleteRule: .cascade)
    var items: [ShoppingListItem]
}
```

# ShoppingListItem

```swift
@Model
final class ShoppingListItem {
    var id: UUID
    var name: String
    var category: String
    var quantity: String?
    var sourceMealName: String?
    var isChecked: Bool
    var isOptionalAdultUpgrade: Bool
    var isKidFallback: Bool
}
```

---

# PlanningConstraints

This can be a plain Codable struct rather than a SwiftData entity.

```swift
struct PlanningConstraints: Codable, Equatable {
    var numberOfMeals: Int
    var maxCookTimeMinutes: Int?
    var availableIngredients: [String]
    var avoidIngredients: [String]
    var desiredRiskLevels: [MealRiskLevel]
    var parentPreferences: [String]
    var recentMealNames: [String]
    var notes: String
}
```

Example:

```json
{
  "numberOfMeals": 4,
  "maxCookTimeMinutes": 45,
  "availableIngredients": ["chicken thighs", "rice", "cucumber", "tortillas"],
  "avoidIngredients": ["tomato"],
  "desiredRiskLevels": ["safe", "bridge"],
  "parentPreferences": ["savory", "adult-interesting", "not bland"],
  "recentMealNames": ["plain pasta", "burgers"],
  "notes": "Kids prefer deconstructed plates and sauces on the side."
}
```

---

# Derived views and helpers

Recommended helper methods:

```swift
extension FoodPreference {
    var status: FoodPreferenceStatus { ... }
    var tags: [FoodTag] { ... }
    var lastOutcome: DinnerOutcome? { ... }
    var acceptanceRate: Double { ... }
}
```

```swift
extension Meal {
    var archetype: MealArchetype { ... }
    var riskLevel: MealRiskLevel { ... }
    var sharedIngredientRatio: Double { ... }
}
```

---

# Data migration considerations

For MVP, keep models simple. Avoid over-normalizing ingredients too early.

Use strings for foods and formats initially because parents will naturally enter things like:

- "plain chicken"
- "cucumber sticks"
- "noodles with butter"
- "cheese but not melted"
- "yogurt dip"

Canonical ingredient mapping can come later.
