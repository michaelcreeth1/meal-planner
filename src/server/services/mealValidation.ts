import {
  ChildProfile,
  Meal,
  MealGenerationResponse,
  MealGenerationResponseSchema
} from "../../shared/domain.js";

export class MealValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MealValidationError";
  }
}

export function validateMealGenerationResponse(
  response: unknown,
  activeChildren: ChildProfile[]
): MealGenerationResponse {
  const parsed = MealGenerationResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new MealValidationError(parsed.error.issues.map((issue) => issue.message).join(", "));
  }

  for (const meal of parsed.data.meals) {
    validateMeal(meal, activeChildren);
  }

  return parsed.data;
}

function validateMeal(meal: Meal, activeChildren: ChildProfile[]): void {
  const childIds = new Set(meal.kidPlates.map((plate) => plate.childProfileId));
  for (const child of activeChildren) {
    if (!childIds.has(child.id)) {
      throw new MealValidationError(`${meal.name} is missing a kid plate for ${child.name}.`);
    }

    const restricted = child.allergiesOrRestrictions.map((item) => item.toLowerCase());
    const childPlate = meal.kidPlates.find((plate) => plate.childProfileId === child.id);
    const childPlateText = [
      ...(childPlate?.plateComponents ?? []),
      ...(childPlate?.fallbackComponents ?? []),
      childPlate?.tinyTry ?? "",
      childPlate?.sauceInstructions ?? ""
    ]
      .join(" ")
      .toLowerCase();

    for (const restriction of restricted) {
      if (restriction && childPlateText.includes(restriction)) {
        throw new MealValidationError(`${meal.name} includes ${restriction} for ${child.name}.`);
      }
    }

    const hardNos = child.foodPreferences
      .filter((preference) => preference.isHardNo)
      .map((preference) => preference.foodName.toLowerCase());
    for (const hardNo of hardNos) {
      if (!hardNo || !childPlateText.includes(hardNo)) continue;
      const tinyTryText = childPlate?.tinyTry.toLowerCase() ?? "";
      const allowedStretchExposure =
        (meal.riskLevel === "stretch" || meal.riskLevel === "adultForward") &&
        tinyTryText.includes(hardNo);

      if (!allowedStretchExposure) {
        throw new MealValidationError(`${meal.name} includes hard-no food ${hardNo} for ${child.name}.`);
      }
    }
  }
}
