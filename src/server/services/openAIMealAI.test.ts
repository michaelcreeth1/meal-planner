import { describe, expect, it } from "vitest";
import { MealGenerationResponseSchema } from "../../shared/domain.js";
import { mapAIMealGenerationResponse } from "./openAIMealAI.js";

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

describe("OpenAI meal mapping", () => {
  it("stamps AI meals with backend IDs and canonical child profile IDs", () => {
    const mapped = mapAIMealGenerationResponse(
      {
        meals: [
          {
            name: "Lemon Chicken Pita Plates",
            adultSummary: "Chicken, pita, cucumber, yogurt sauce, herbs, and lemony salad.",
            archetype: "pitaPlate",
            riskLevel: "bridge",
            whyItFits: "The shared base stays plain while adult flavor comes from toppings.",
            prepStrategy: ["Cook mild chicken.", "Serve sauce separately."],
            adultOnlyComponents: ["herb salad"],
            sharedComponents: ["chicken", "pita", "cucumber"],
            optionalAdultUpgrades: ["chili crisp"],
            estimatedCookTimeMinutes: 30,
            components: [
              {
                name: "chicken",
                role: "shared",
                tags: ["protein"],
                notes: "Pull kid portions before adding extra lemon."
              }
            ],
            kidPlates: [
              {
                childProfileId: "not-the-real-id",
                childName: "Charlotte",
                plateComponents: ["plain chicken", "pita", "cucumber"],
                sauceInstructions: "Yogurt sauce on the side.",
                fallbackComponents: ["fruit"],
                tinyTry: "Touch pita to yogurt sauce.",
                reasoning: "Separate components lower pressure.",
                notes: ""
              },
              {
                childProfileId: children[1]!.id,
                childName: "James",
                plateComponents: ["plain chicken", "pita"],
                sauceInstructions: "No sauce unless requested.",
                fallbackComponents: [],
                tinyTry: "Smell the cucumber.",
                reasoning: "Keeps the safe base visible.",
                notes: ""
              }
            ]
          }
        ]
      },
      children
    );

    expect(MealGenerationResponseSchema.parse(mapped)).toBeTruthy();
    expect(mapped.meals[0]?.source).toBe("ai");
    expect(mapped.meals[0]?.components[0]?.id).toEqual(expect.any(String));
    expect(mapped.meals[0]?.kidPlates.map((plate) => plate.childProfileId)).toEqual([
      children[0]!.id,
      children[1]!.id
    ]);
  });
});
