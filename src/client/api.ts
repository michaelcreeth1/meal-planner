import {
  ChildProfile,
  DinnerOutcome,
  DinnerResult,
  FoodPreference,
  FoodTag,
  Meal,
  MealGenerationResponse,
  MealRiskLevel,
  PlatingPreference,
  ShoppingList
} from "../shared/domain";

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(typeof body.error === "string" ? body.error : "Request failed");
  }

  return response.json() as Promise<T>;
}

export const api = {
  children: () => request<{ children: ChildProfile[] }>("/api/children"),
  saveChild: (child: {
    id?: string;
    name: string;
    age: number | null;
    notes: string;
    defaultPlatingPreference: PlatingPreference;
    allergiesOrRestrictions: string[];
  }) =>
    request<{ child: ChildProfile }>("/api/children", {
      method: "POST",
      body: JSON.stringify(child)
    }),
  addFoodPreference: (preference: {
    childId: string;
    foodName: string;
    status: FoodPreference["status"];
    tags: FoodTag[];
    acceptedFormats: string[];
    rejectedFormats: string[];
    notes: string;
    isSafeFallback: boolean;
    isHardNo: boolean;
  }) =>
    request<{ foodPreference: FoodPreference }>("/api/food-preferences", {
      method: "POST",
      body: JSON.stringify(preference)
    }),
  generateMeals: (constraints: {
    numberOfMeals: number;
    maxCookTimeMinutes: number | null;
    availableIngredients: string[];
    avoidIngredients: string[];
    desiredRiskLevels: MealRiskLevel[];
    parentPreferences: string[];
    notes: string;
  }) =>
    request<MealGenerationResponse>("/api/generate-meals", {
      method: "POST",
      body: JSON.stringify(constraints)
    }),
  meals: () => request<{ meals: Meal[] }>("/api/meals"),
  saveMeal: (meal: Meal) =>
    request<{ meal: Meal }>("/api/meals", {
      method: "POST",
      body: JSON.stringify(meal)
    }),
  logDinner: (payload: {
    mealId: string;
    workedWell: boolean;
    overallNotes: string;
    exposureResults: Array<{
      childProfileId: string;
      childNameSnapshot: string;
      foodName: string;
      format: string;
      outcome: DinnerOutcome;
      notes: string;
    }>;
  }) =>
    request<{ dinnerResult: DinnerResult }>("/api/dinner-results", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  shoppingLists: () => request<{ shoppingLists: ShoppingList[] }>("/api/shopping-lists"),
  createShoppingList: (mealIds: string[], title = "Dinner shopping list") =>
    request<{ shoppingList: ShoppingList }>("/api/shopping-lists", {
      method: "POST",
      body: JSON.stringify({ mealIds, title })
    }),
  toggleShoppingItem: (listId: string, itemId: string) =>
    request<{ shoppingList: ShoppingList }>(
      `/api/shopping-lists/${listId}/items/${itemId}/toggle`,
      { method: "POST" }
    )
};
