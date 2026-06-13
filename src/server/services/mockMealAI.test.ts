import { describe, expect, it } from "vitest";
import { MockMealAIService } from "./mockMealAI.js";
import { emptyConstraints } from "../../shared/domain.js";

const children = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Charlotte",
    age: null,
    notes: "",
    isArchived: false,
    defaultPlatingPreference: "separateComponents" as const,
    allergiesOrRestrictions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    foodPreferences: []
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "James",
    age: null,
    notes: "",
    isArchived: false,
    defaultPlatingPreference: "separateComponents" as const,
    allergiesOrRestrictions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    foodPreferences: []
  }
];

describe("MockMealAIService", () => {
  it("returns one kid plate for every active child", async () => {
    const service = new MockMealAIService();
    const response = await service.generateMealSuggestions({
      family: { children },
      constraints: {
        ...emptyConstraints(),
        numberOfMeals: 1,
        availableIngredients: ["chicken thighs", "rice", "cucumber"]
      }
    });

    expect(response.meals).toHaveLength(1);
    expect(response.meals[0]?.kidPlates.map((plate) => plate.childNameSnapshot)).toEqual([
      "Charlotte",
      "James"
    ]);
  });
});
