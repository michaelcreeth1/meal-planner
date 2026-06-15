import { randomUUID } from "node:crypto";
import {
  ChildProfile,
  FoodTag,
  KidPlate,
  Meal,
  MealArchetype,
  MealComponent,
  MealGenerationRequest,
  MealGenerationResponse,
  MealRiskLevel
} from "../../shared/domain.js";

function nowIso(): string {
  return new Date().toISOString();
}

function includesAny(ingredients: string[], needles: string[]): boolean {
  const haystack = ingredients.join(" ").toLowerCase();
  return needles.some((needle) => haystack.includes(needle));
}

function component(name: string, role: MealComponent["role"], tags: FoodTag[] = [], notes = ""): MealComponent {
  return {
    id: randomUUID(),
    name,
    role,
    tags,
    notes
  };
}

function kidPlate(
  child: ChildProfile,
  plateComponents: string[],
  tinyTry: string,
  fallbackComponents: string[] = []
): KidPlate {
  const safeFallbacks = child.foodPreferences
    .filter((preference) => preference.isSafeFallback)
    .map((preference) => preference.foodName);

  return {
    id: randomUUID(),
    childProfileId: child.id,
    childNameSnapshot: child.name,
    plateComponents,
    sauceInstructions:
      child.defaultPlatingPreference === "saucesOnSide" ||
      child.notes.toLowerCase().includes("sauce")
        ? "Sauce on the side as an optional dip."
        : "Keep sauces separate unless already accepted.",
    fallbackComponents: [...new Set([...fallbackComponents, ...safeFallbacks])],
    tinyTry,
    reasoning:
      "Uses separated components and keeps adult flavor in toppings, sauces, or finishing steps.",
    notes: ""
  };
}

function mealBase(input: {
  name: string;
  adultSummary: string;
  archetype: MealArchetype;
  riskLevel: MealRiskLevel;
  whyItFits: string;
  prepStrategy: string[];
  sharedComponents: string[];
  adultOnlyComponents: string[];
  optionalAdultUpgrades: string[];
  estimatedCookTimeMinutes: number;
  components: MealComponent[];
  kidPlates: KidPlate[];
}): Meal {
  const timestamp = nowIso();
  return {
    id: randomUUID(),
    source: "mock",
    createdAt: timestamp,
    updatedAt: timestamp,
    lastServedAt: null,
    workedWellCount: 0,
    ...input
  };
}

function chickenRiceMeal(children: ChildProfile[]): Meal {
  return mealBase({
    name: "Chicken Shawarma Rice Bowls",
    adultSummary:
      "Mildly spiced chicken over rice with cucumber, pita, yogurt sauce, herbs, and pickled onions.",
    archetype: "bowl",
    riskLevel: "bridge",
    estimatedCookTimeMinutes: 40,
    whyItFits:
      "Uses shared chicken, rice, cucumber, and pita while adult flavor comes from toppings and sauce served separately.",
    sharedComponents: ["chicken", "rice", "cucumber", "pita"],
    adultOnlyComponents: ["pickled onions", "herbs", "hot sauce"],
    optionalAdultUpgrades: ["feta", "sumac onions"],
    prepStrategy: [
      "Cook chicken mildly and pull kid portions before adding extra spice.",
      "Serve yogurt sauce in a dip cup.",
      "Keep adult toppings separate."
    ],
    components: [
      component("chicken", "shared", ["protein"], "Pull kid portions before extra spice."),
      component("rice", "shared", ["carb", "plain"], "Serve plain for kids."),
      component("cucumber", "shared", ["vegetable", "raw", "crunchy"], "Cut into sticks."),
      component("pita", "shared", ["carb"], "Serve separate."),
      component("pickled onions", "adultOnly", ["topping"], "Adult topping.")
    ],
    kidPlates: children.map((child) =>
      kidPlate(child, ["plain chicken pieces", "rice", "cucumber sticks", "pita"], "Dip one corner of pita in yogurt sauce.", ["fruit"])
    )
  });
}

function tacoMeal(children: ChildProfile[]): Meal {
  return mealBase({
    name: "Build-Your-Own Chicken Taco Plates",
    adultSummary:
      "Warm tortillas with mild chicken, cheese, avocado, lime crema, salsa, cilantro, and crunchy cabbage.",
    archetype: "taco",
    riskLevel: "bridge",
    estimatedCookTimeMinutes: 30,
    whyItFits:
      "Tacos deconstruct naturally: tortillas, protein, cheese, and toppings can all stay separate.",
    sharedComponents: ["tortillas", "chicken", "cheese", "avocado"],
    adultOnlyComponents: ["salsa", "cilantro", "cabbage", "lime crema"],
    optionalAdultUpgrades: ["pickled jalapenos", "hot sauce"],
    prepStrategy: [
      "Keep tortillas, chicken, cheese, and toppings in separate bowls.",
      "Pull mild chicken before adding extra seasoning.",
      "Offer salsa as a tiny smell or dip, not a required bite."
    ],
    components: [
      component("tortillas", "shared", ["carb", "fingerFood"]),
      component("chicken", "shared", ["protein"]),
      component("cheese", "shared", ["dairy"]),
      component("salsa", "adultOnly", ["sauce", "spicy"])
    ],
    kidPlates: children.map((child) =>
      kidPlate(child, ["tortilla", "plain chicken", "cheese", "avocado on the side"], "Smell the salsa or touch a tiny dot with a chip.", ["fruit"])
    )
  });
}

function pastaMeal(children: ChildProfile[]): Meal {
  return mealBase({
    name: "Pasta With Sauce on the Side",
    adultSummary:
      "Pasta with garlicky red sauce, parmesan, herbs, and optional sausage while kid portions stay plain or lightly buttered.",
    archetype: "pasta",
    riskLevel: "safe",
    estimatedCookTimeMinutes: 25,
    whyItFits:
      "Plain pasta can be set aside before sauce, so the adult version gets flavor without forcing a mixed kid plate.",
    sharedComponents: ["pasta", "parmesan", "butter"],
    adultOnlyComponents: ["red sauce", "garlic", "herbs"],
    optionalAdultUpgrades: ["sausage", "chili flakes"],
    prepStrategy: [
      "Reserve plain pasta before tossing the adult portion with sauce.",
      "Put sauce in a small dip cup for kids who tolerate dipping.",
      "Add herbs and chili flakes only to adult plates."
    ],
    components: [
      component("pasta", "shared", ["carb", "plain"]),
      component("parmesan", "shared", ["dairy", "topping"]),
      component("red sauce", "adultOnly", ["sauce"]),
      component("sausage", "optional", ["protein"])
    ],
    kidPlates: children.map((child) =>
      kidPlate(child, ["plain pasta", "parmesan on the side", "butter"], "Touch a noodle to the sauce cup.", ["fruit"])
    )
  });
}

function sausageMeal(children: ChildProfile[]): Meal {
  return mealBase({
    name: "Sausage, Rice, and Pepper Bowls",
    adultSummary:
      "Sliced sausage over rice with sauteed peppers, onions, herbs, and a bright yogurt sauce.",
    archetype: "bowl",
    riskLevel: "stretch",
    estimatedCookTimeMinutes: 35,
    whyItFits:
      "Rice stays plain, sausage can be served separately, and peppers can be offered raw as a lower-pressure bridge.",
    sharedComponents: ["sausage", "rice", "bell pepper"],
    adultOnlyComponents: ["onions", "herbs", "yogurt sauce"],
    optionalAdultUpgrades: ["hot honey", "pickled peppers"],
    prepStrategy: [
      "Keep rice plain.",
      "Plate kid sausage slices before building adult bowls.",
      "Offer raw pepper strips separately if cooked peppers are too much."
    ],
    components: [
      component("sausage", "shared", ["protein"]),
      component("rice", "shared", ["carb", "plain"]),
      component("bell pepper", "shared", ["vegetable", "raw"]),
      component("onions", "adultOnly", ["vegetable"])
    ],
    kidPlates: children.map((child) =>
      kidPlate(child, ["rice", "sausage slices", "raw pepper strip"], "One pepper strip can sit near the rice with no pressure.", ["cucumber", "fruit"])
    )
  });
}

function snackBoardMeal(children: ChildProfile[]): Meal {
  return mealBase({
    name: "Low-Pressure Snack Board Dinner",
    adultSummary:
      "A board of bread, cheese, fruit, crunchy vegetables, hummus, salami, olives, and an adult salad or spicy dip.",
    archetype: "snackBoard",
    riskLevel: "safe",
    estimatedCookTimeMinutes: 15,
    whyItFits:
      "Everything is separate, fast to plate, and easy to adapt per child while adults still get interesting add-ons.",
    sharedComponents: ["bread", "cheese", "fruit", "cucumber"],
    adultOnlyComponents: ["olives", "spicy dip", "salad"],
    optionalAdultUpgrades: ["marinated feta", "pepperoncini"],
    prepStrategy: [
      "Put safe foods on each child plate first.",
      "Keep dips in separate cups.",
      "Place one tiny exposure near a safe food."
    ],
    components: [
      component("bread", "shared", ["carb"]),
      component("cheese", "shared", ["dairy"]),
      component("fruit", "shared", ["fruit", "fallback"]),
      component("cucumber", "shared", ["vegetable", "raw", "crunchy"]),
      component("olives", "adultOnly", ["topping"])
    ],
    kidPlates: children.map((child) =>
      kidPlate(child, ["bread", "cheese", "fruit", "cucumber"], "One tiny dot of hummus on the edge of the plate.", [])
    )
  });
}

export class MockMealAIService {
  async generateMealSuggestions(request: MealGenerationRequest): Promise<MealGenerationResponse> {
    const activeChildren = request.family.children.filter((child) => !child.isArchived);
    const ingredients = [...request.constraints.availableIngredients, request.constraints.guidance];
    const candidates: Meal[] = [];

    if (includesAny(ingredients, ["chicken"]) && includesAny(ingredients, ["rice"])) {
      candidates.push(chickenRiceMeal(activeChildren));
    }
    if (includesAny(ingredients, ["tortilla", "taco"])) {
      candidates.push(tacoMeal(activeChildren));
    }
    if (includesAny(ingredients, ["pasta", "noodle"])) {
      candidates.push(pastaMeal(activeChildren));
    }
    if (includesAny(ingredients, ["sausage"])) {
      candidates.push(sausageMeal(activeChildren));
    }

    candidates.push(snackBoardMeal(activeChildren));

    const avoid = request.constraints.avoidIngredients.map((item) => item.toLowerCase());
    const filtered = candidates.filter((meal) => {
      const allWords = [
        meal.name,
        meal.adultSummary,
        ...meal.sharedComponents,
        ...meal.adultOnlyComponents,
        ...meal.optionalAdultUpgrades
      ]
        .join(" ")
        .toLowerCase();
      return !avoid.some((item) => item && allWords.includes(item));
    });

    return {
      meals: filtered.slice(0, request.constraints.numberOfMeals)
    };
  }
}
