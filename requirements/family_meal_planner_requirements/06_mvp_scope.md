# 06 — MVP Scope

This document separates the MVP from later versions.

---

# MVP product goal

Build a local-first iPhone app that lets parents:

1. Create child food profiles.
2. Track accepted/rejected foods and presentation notes.
3. Generate adult meal ideas with kid-specific deconstructed plates.
4. Save meals.
5. Log dinner outcomes quickly.
6. Generate a simple shopping list.

The MVP should prove the core workflow before investing in recipe databases, accounts, cloud sync, or advanced personalization.

---

# MVP must-haves

## 1. Local child profiles

Required:

- Add child.
- Edit child.
- Set default plating preference.
- Add allergies/restrictions as text.

Not required:

- Multiple caregivers.
- Cloud sync.
- Pediatric nutrition advice.

## 2. Food preferences

Required:

- Add food name.
- Set status.
- Add accepted formats.
- Add rejected formats.
- Add notes.
- Mark safe fallback.
- Mark hard no.

Not required:

- Canonical ingredient database.
- Barcode scanning.
- Nutrition facts.
- Photo recognition.

## 3. AI meal suggestions

Required:

- Generate meal ideas from child profiles and constraints.
- Show adult meal.
- Show kid plates.
- Show shared components.
- Show prep strategy.
- Show tiny exposure.
- Show risk level.

Implementation requirement:

- Use an AI service protocol.
- Start with a mock service.
- Make real AI integration swappable later.

Not required:

- Full recipe instructions.
- Exact nutrition calculation.
- Real-time grocery pricing.

## 4. Meal saving

Required:

- Save generated meals.
- View saved meals.
- Open meal detail.
- Log result from a saved meal.

Not required:

- Advanced search.
- Tags beyond basic risk/archetype.

## 5. Dinner result logging

Required:

- Log outcomes for each child and component.
- Use fast buttons.
- Save notes.
- Update basic counters on food preferences.

Not required:

- Complex charts.
- Automated psychological interpretation.

## 6. Shopping list

Required:

- Generate list from selected meals.
- Group by category.
- Check off items.

Not required:

- Store integrations.
- Delivery ordering.
- Price comparison.

---

# Suggested MVP screens

1. Home screen.
2. Child list.
3. Child detail.
4. Food preference editor.
5. Meal generator input.
6. Generated meal list.
7. Meal detail.
8. Dinner result logger.
9. Shopping list.

---

# MVP technical stack

Recommended:

- SwiftUI.
- SwiftData.
- `NavigationStack`.
- Local-only persistence.
- Async AI service protocol.
- Mock AI service with sample JSON.
- No authentication.
- No backend.

---

# MVP non-goals

Do not build these initially:

- Recipe scraping.
- Social sharing.
- Cloud accounts.
- Nutrition coaching.
- Calorie tracking.
- Grocery store integrations.
- Barcode scanning.
- Meal photos.
- Child reward system.
- Push notifications.
- Complex charts.
- Multi-device sync.

---

# v1 enhancements

After the MVP works, add:

- Real LLM integration.
- Meal plan editing.
- Better ingredient parsing.
- Food trajectory insights.
- Repetition and burnout detection.
- More robust shopping list quantities.
- Saved prompts/refinements.
- "Regenerate like this".
- "Lower risk" and "more adult-interesting" refinements.

---

# v2 enhancements

Possible later features:

- Cloud sync.
- Partner/caregiver sharing.
- Calendar integration.
- Recipe import from URLs.
- Photo-based meal logging.
- Pantry inventory.
- Grocery pickup integration.
- Wearable/voice quick logging.
- Advanced food relationship graph.
- Personalized weekly exposure plan.

---

# Build sequence

Recommended implementation order:

## Phase 1 — Models and persistence

- Create SwiftData models.
- Add sample data.
- Build profile list and detail.
- Build food preference editor.

## Phase 2 — Meal UI

- Create meal models.
- Create static meal cards.
- Create meal detail screen.
- Create kid plate cards.

## Phase 3 — Mock AI

- Add `MealAIService` protocol.
- Add `MockMealAIService`.
- Wire meal generator input to mock output.
- Save generated meals.

## Phase 4 — Logging

- Create dinner result logger.
- Save results.
- Update food preference counters.

## Phase 5 — Shopping list

- Generate shopping list from selected meals.
- Add checkoff UI.

## Phase 6 — Real AI integration

- Add real LLM service.
- Add JSON validation.
- Add error handling and retry.

---

# Definition of done for MVP

The MVP is done when a user can:

1. Add two child profiles.
2. Add at least five food preferences per child.
3. Generate three dinner ideas.
4. See adult meal and kid plates for each idea.
5. Save one meal.
6. Log how each child did with each component.
7. See food preference counters update.
8. Generate a categorized shopping list from selected meals.
9. Use the app again after force quitting and see saved data persisted.
