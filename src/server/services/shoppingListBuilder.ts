import { randomUUID } from "node:crypto";
import { Meal, ShoppingCategory, ShoppingList, ShoppingListItem } from "../../shared/domain.js";

function nowIso(): string {
  return new Date().toISOString();
}

const categoryHints: Record<ShoppingCategory, string[]> = {
  produce: ["cucumber", "pepper", "onion", "herb", "fruit", "avocado", "lime", "salad"],
  meatSeafood: ["chicken", "sausage", "beef", "salmon", "fish", "pork", "turkey", "salami"],
  dairy: ["cheese", "yogurt", "feta", "parmesan", "butter", "crema"],
  pantry: ["rice", "pasta", "sauce", "hummus", "hot sauce", "pickled", "olive"],
  frozen: ["frozen"],
  bakery: ["pita", "bread", "tortilla", "bun"],
  kidSafeFallbacks: [],
  optionalAdultUpgrades: []
};

function categorize(name: string, fallback: ShoppingCategory = "pantry"): ShoppingCategory {
  const lower = name.toLowerCase();
  for (const [category, hints] of Object.entries(categoryHints) as [ShoppingCategory, string[]][]) {
    if (hints.some((hint) => lower.includes(hint))) return category;
  }
  return fallback;
}

function item(
  name: string,
  sourceMealName: string,
  options: Partial<ShoppingListItem> = {}
): ShoppingListItem {
  const isOptionalAdultUpgrade = Boolean(options.isOptionalAdultUpgrade);
  const isKidFallback = Boolean(options.isKidFallback);
  return {
    id: randomUUID(),
    name,
    category:
      options.category ??
      (isOptionalAdultUpgrade
        ? "optionalAdultUpgrades"
        : isKidFallback
          ? "kidSafeFallbacks"
          : categorize(name)),
    quantity: options.quantity ?? null,
    sourceMealName,
    isChecked: false,
    isOptionalAdultUpgrade,
    isKidFallback
  };
}

export function buildShoppingList(meals: Meal[], title = "Dinner shopping list"): ShoppingList {
  const timestamp = nowIso();
  const seen = new Set<string>();
  const items: ShoppingListItem[] = [];

  for (const meal of meals) {
    const add = (candidate: ShoppingListItem) => {
      const key = `${candidate.name.toLowerCase()}|${candidate.category}`;
      if (seen.has(key)) return;
      seen.add(key);
      items.push(candidate);
    };

    for (const componentName of meal.sharedComponents) {
      add(item(componentName, meal.name));
    }

    for (const plate of meal.kidPlates) {
      for (const fallback of plate.fallbackComponents) {
        add(item(fallback, meal.name, { isKidFallback: true }));
      }
    }

    for (const upgrade of meal.optionalAdultUpgrades) {
      add(item(upgrade, meal.name, { isOptionalAdultUpgrade: true }));
    }
  }

  return {
    id: randomUUID(),
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
    items
  };
}
