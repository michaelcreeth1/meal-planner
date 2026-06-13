import { z } from "zod";

export const foodPreferenceStatuses = [
  "loved",
  "accepted",
  "sometimes",
  "tinyTry",
  "rejected",
  "burnedOut",
  "unknown"
] as const;

export const foodTags = [
  "protein",
  "carb",
  "vegetable",
  "fruit",
  "dairy",
  "sauce",
  "dip",
  "crunchy",
  "soft",
  "spicy",
  "sweet",
  "plain",
  "mixed",
  "fingerFood",
  "raw",
  "cooked",
  "topping",
  "fallback"
] as const;

export const platingPreferences = [
  "separateComponents",
  "saucesOnSide",
  "mixedOkay",
  "fingerFoods",
  "noPreference"
] as const;

export const mealRiskLevels = ["safe", "bridge", "stretch", "adultForward"] as const;

export const dinnerOutcomes = [
  "ateHappily",
  "ateSome",
  "tinyTry",
  "touchedSmelledLicked",
  "refused",
  "meltdown",
  "notOffered"
] as const;

export const mealArchetypes = [
  "bowl",
  "taco",
  "pitaPlate",
  "wrap",
  "pasta",
  "sheetPan",
  "burger",
  "pizza",
  "snackBoard",
  "skewer",
  "breakfastForDinner",
  "stirFry",
  "soup",
  "other"
] as const;

export const shoppingCategories = [
  "produce",
  "meatSeafood",
  "dairy",
  "pantry",
  "frozen",
  "bakery",
  "kidSafeFallbacks",
  "optionalAdultUpgrades"
] as const;

export const FoodPreferenceStatusSchema = z.enum(foodPreferenceStatuses);
export const FoodTagSchema = z.enum(foodTags);
export const PlatingPreferenceSchema = z.enum(platingPreferences);
export const MealRiskLevelSchema = z.enum(mealRiskLevels);
export const DinnerOutcomeSchema = z.enum(dinnerOutcomes);
export const MealArchetypeSchema = z.enum(mealArchetypes);
export const ShoppingCategorySchema = z.enum(shoppingCategories);

export type FoodPreferenceStatus = z.infer<typeof FoodPreferenceStatusSchema>;
export type FoodTag = z.infer<typeof FoodTagSchema>;
export type PlatingPreference = z.infer<typeof PlatingPreferenceSchema>;
export type MealRiskLevel = z.infer<typeof MealRiskLevelSchema>;
export type DinnerOutcome = z.infer<typeof DinnerOutcomeSchema>;
export type MealArchetype = z.infer<typeof MealArchetypeSchema>;
export type ShoppingCategory = z.infer<typeof ShoppingCategorySchema>;

export const FoodPreferenceSchema = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  foodName: z.string().min(1),
  status: FoodPreferenceStatusSchema,
  tags: z.array(FoodTagSchema),
  acceptedFormats: z.array(z.string()),
  rejectedFormats: z.array(z.string()),
  notes: z.string(),
  isSafeFallback: z.boolean(),
  isHardNo: z.boolean(),
  lastOfferedAt: z.string().nullable(),
  lastOutcome: DinnerOutcomeSchema.nullable(),
  exposureCount: z.number().int().nonnegative(),
  acceptedCount: z.number().int().nonnegative(),
  refusedCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const ChildProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  age: z.number().int().positive().nullable(),
  notes: z.string(),
  isArchived: z.boolean(),
  defaultPlatingPreference: PlatingPreferenceSchema,
  allergiesOrRestrictions: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  foodPreferences: z.array(FoodPreferenceSchema)
});

export const MealComponentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  role: z.enum(["shared", "adultOnly", "kidOnly", "optional", "fallback"]),
  tags: z.array(FoodTagSchema),
  notes: z.string()
});

export const KidPlateSchema = z.object({
  id: z.string().uuid(),
  childProfileId: z.string().uuid(),
  childNameSnapshot: z.string().min(1),
  plateComponents: z.array(z.string().min(1)),
  sauceInstructions: z.string(),
  fallbackComponents: z.array(z.string()),
  tinyTry: z.string(),
  reasoning: z.string(),
  notes: z.string()
});

export const MealSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  adultSummary: z.string(),
  archetype: MealArchetypeSchema,
  riskLevel: MealRiskLevelSchema,
  whyItFits: z.string(),
  prepStrategy: z.array(z.string()),
  adultOnlyComponents: z.array(z.string()),
  sharedComponents: z.array(z.string()),
  optionalAdultUpgrades: z.array(z.string()),
  estimatedCookTimeMinutes: z.number().int().positive().nullable(),
  source: z.enum(["ai", "manual", "sample", "mock"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastServedAt: z.string().nullable(),
  workedWellCount: z.number().int().nonnegative(),
  components: z.array(MealComponentSchema),
  kidPlates: z.array(KidPlateSchema)
});

export const PlanningConstraintsSchema = z.object({
  numberOfMeals: z.number().int().min(1).max(7),
  maxCookTimeMinutes: z.number().int().positive().nullable(),
  availableIngredients: z.array(z.string()),
  avoidIngredients: z.array(z.string()),
  desiredRiskLevels: z.array(MealRiskLevelSchema),
  parentPreferences: z.array(z.string()),
  recentMealNames: z.array(z.string()),
  notes: z.string()
});

export const MealGenerationRequestSchema = z.object({
  family: z.object({
    children: z.array(ChildProfileSchema)
  }),
  constraints: PlanningConstraintsSchema
});

export const MealGenerationResponseSchema = z.object({
  meals: z.array(MealSchema)
});

export const FoodExposureResultSchema = z.object({
  id: z.string().uuid(),
  childProfileId: z.string().uuid(),
  childNameSnapshot: z.string(),
  foodName: z.string(),
  format: z.string(),
  outcome: DinnerOutcomeSchema,
  notes: z.string()
});

export const DinnerResultSchema = z.object({
  id: z.string().uuid(),
  mealId: z.string().uuid().nullable(),
  mealNameSnapshot: z.string(),
  servedAt: z.string(),
  overallNotes: z.string(),
  workedWell: z.boolean(),
  createdAt: z.string(),
  exposureResults: z.array(FoodExposureResultSchema)
});

export const ShoppingListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: ShoppingCategorySchema,
  quantity: z.string().nullable(),
  sourceMealName: z.string().nullable(),
  isChecked: z.boolean(),
  isOptionalAdultUpgrade: z.boolean(),
  isKidFallback: z.boolean()
});

export const ShoppingListSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(ShoppingListItemSchema)
});

export type FoodPreference = z.infer<typeof FoodPreferenceSchema>;
export type ChildProfile = z.infer<typeof ChildProfileSchema>;
export type MealComponent = z.infer<typeof MealComponentSchema>;
export type KidPlate = z.infer<typeof KidPlateSchema>;
export type Meal = z.infer<typeof MealSchema>;
export type PlanningConstraints = z.infer<typeof PlanningConstraintsSchema>;
export type MealGenerationRequest = z.infer<typeof MealGenerationRequestSchema>;
export type MealGenerationResponse = z.infer<typeof MealGenerationResponseSchema>;
export type FoodExposureResult = z.infer<typeof FoodExposureResultSchema>;
export type DinnerResult = z.infer<typeof DinnerResultSchema>;
export type ShoppingListItem = z.infer<typeof ShoppingListItemSchema>;
export type ShoppingList = z.infer<typeof ShoppingListSchema>;

export function emptyConstraints(): PlanningConstraints {
  return {
    numberOfMeals: 3,
    maxCookTimeMinutes: 45,
    availableIngredients: [],
    avoidIngredients: [],
    desiredRiskLevels: ["bridge"],
    parentPreferences: ["adult-interesting", "deconstructed"],
    recentMealNames: [],
    notes: ""
  };
}

export function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function humanizeEnum(value: string): string {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}
