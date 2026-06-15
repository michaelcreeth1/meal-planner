import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  FoodTagSchema,
  MealArchetypeSchema,
  MealRiskLevelSchema
} from "../../shared/domain.js";
import type {
  ChildProfile,
  KidPlate,
  Meal,
  MealComponent,
  MealGenerationRequest,
  MealGenerationResponse
} from "../../shared/domain.js";
import type { MealAIService } from "./mealAIService.js";

const AIMealComponentSchema = z.object({
  name: z.string(),
  role: z.enum(["shared", "adultOnly", "kidOnly", "optional", "fallback"]),
  tags: z.array(FoodTagSchema),
  notes: z.string()
});

const AIKidPlateSchema = z.object({
  childProfileId: z.string(),
  childName: z.string(),
  plateComponents: z.array(z.string()),
  sauceInstructions: z.string(),
  fallbackComponents: z.array(z.string()),
  tinyTry: z.string(),
  reasoning: z.string(),
  notes: z.string()
});

const AIMealSchema = z.object({
  name: z.string(),
  adultSummary: z.string(),
  archetype: MealArchetypeSchema,
  riskLevel: MealRiskLevelSchema,
  whyItFits: z.string(),
  prepStrategy: z.array(z.string()),
  adultOnlyComponents: z.array(z.string()),
  sharedComponents: z.array(z.string()),
  optionalAdultUpgrades: z.array(z.string()),
  estimatedCookTimeMinutes: z.number().int().positive().nullable(),
  components: z.array(AIMealComponentSchema),
  kidPlates: z.array(AIKidPlateSchema)
});

const AIMealGenerationResponseSchema = z.object({
  meals: z.array(AIMealSchema)
});

const ReasoningEffortSchema = z.enum(["low", "medium", "high", "xhigh"]);

type AIMealGenerationResponse = z.infer<typeof AIMealGenerationResponseSchema>;
type AIMeal = z.infer<typeof AIMealSchema>;
type AIKidPlate = z.infer<typeof AIKidPlateSchema>;

const DEFAULT_MODEL = "gpt-5.5";

const SYSTEM_INSTRUCTIONS = `
You generate practical dinner plans for a private family meal-planning app.

The goal is not kid food. The goal is adult meals that can be translated into low-pressure child plates.
Every meal must be usable on a weeknight by a tired parent.

Rules:
- Respect allergies and restrictions absolutely.
- Do not put a child's hard-no food on their plate unless the meal risk is stretch or adultForward and it appears only as the tinyTry exposure.
- Prefer shared base components with adult flavor added through sauces, toppings, herbs, heat, acid, or finishing steps.
- Kid plates should be deconstructed and specific to each child.
- Include safe fallback components when the child has known safe fallbacks.
- Treat dinner guidance as broad intent. It may include ingredients, cuisine, cooking method, mood, leftovers, time pressure, or foods to avoid.
- Use available ingredients when they are provided, but do not assume the guidance is only an inventory list.
- Avoid recent meals and explicitly avoided ingredients.
- Return the requested number of meals unless constraints make that impossible.
- Keep names concrete and grocery-list friendly.
- Keep prep strategies short, ordered, and realistic.
- Use only the enum values allowed by the schema.
`;

export class OpenAIMealAIService implements MealAIService {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly reasoningEffort: "low" | "medium" | "high" | "xhigh";

  constructor(input: { apiKey?: string; model?: string; reasoningEffort?: string } = {}) {
    const apiKey = input.apiKey ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai.");
    }

    this.client = new OpenAI({ apiKey });
    this.model = input.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
    this.reasoningEffort = parseReasoningEffort(input.reasoningEffort ?? process.env.OPENAI_REASONING_EFFORT);
  }

  async generateMealSuggestions(request: MealGenerationRequest): Promise<MealGenerationResponse> {
    const activeChildren = request.family.children.filter((child) => !child.isArchived);
    const response = await this.client.responses.parse({
      model: this.model,
      instructions: SYSTEM_INSTRUCTIONS,
      input: JSON.stringify(buildPromptPayload(request, activeChildren), null, 2),
      reasoning: { effort: this.reasoningEffort },
      text: {
        format: zodTextFormat(AIMealGenerationResponseSchema, "meal_generation_response"),
        verbosity: "low"
      }
    });

    const parsed = response.output_parsed;
    if (!parsed) throw new Error("OpenAI returned an empty or unparseable meal generation response.");

    return mapAIMealGenerationResponse(parsed, activeChildren);
  }
}

export function mapAIMealGenerationResponse(
  response: AIMealGenerationResponse,
  activeChildren: ChildProfile[]
): MealGenerationResponse {
  const timestamp = new Date().toISOString();
  return {
    meals: response.meals.map((meal) => mapAIMeal(meal, activeChildren, timestamp))
  };
}

function mapAIMeal(meal: AIMeal, activeChildren: ChildProfile[], timestamp: string): Meal {
  return {
    id: randomUUID(),
    source: "ai",
    createdAt: timestamp,
    updatedAt: timestamp,
    lastServedAt: null,
    workedWellCount: 0,
    ...meal,
    components: meal.components.map(mapAIComponent),
    kidPlates: meal.kidPlates.map((plate) => mapAIKidPlate(plate, activeChildren))
  };
}

function mapAIComponent(component: z.infer<typeof AIMealComponentSchema>): MealComponent {
  return {
    id: randomUUID(),
    ...component
  };
}

function mapAIKidPlate(plate: AIKidPlate, activeChildren: ChildProfile[]): KidPlate {
  const child =
    activeChildren.find((candidate) => candidate.id === plate.childProfileId) ??
    activeChildren.find((candidate) => candidate.name.toLowerCase() === plate.childName.toLowerCase());

  return {
    id: randomUUID(),
    childProfileId: child?.id ?? plate.childProfileId,
    childNameSnapshot: child?.name ?? plate.childName,
    plateComponents: plate.plateComponents,
    sauceInstructions: plate.sauceInstructions,
    fallbackComponents: plate.fallbackComponents,
    tinyTry: plate.tinyTry,
    reasoning: plate.reasoning,
    notes: plate.notes
  };
}

function buildPromptPayload(request: MealGenerationRequest, activeChildren: ChildProfile[]) {
  return {
    task: "Generate family dinner meal suggestions.",
    constraints: {
      ...request.constraints,
      guidance: request.constraints.guidance
    },
    activeChildren: activeChildren.map((child) => ({
      id: child.id,
      name: child.name,
      age: child.age,
      notes: child.notes,
      defaultPlatingPreference: child.defaultPlatingPreference,
      allergiesOrRestrictions: child.allergiesOrRestrictions,
      foodPreferences: child.foodPreferences.map((preference) => ({
        foodName: preference.foodName,
        status: preference.status,
        tags: preference.tags,
        acceptedFormats: preference.acceptedFormats,
        rejectedFormats: preference.rejectedFormats,
        notes: preference.notes,
        isSafeFallback: preference.isSafeFallback,
        isHardNo: preference.isHardNo,
        lastOutcome: preference.lastOutcome,
        exposureCount: preference.exposureCount,
        acceptedCount: preference.acceptedCount,
        refusedCount: preference.refusedCount
      }))
    }))
  };
}

function parseReasoningEffort(value: string | undefined): "low" | "medium" | "high" | "xhigh" {
  const parsed = ReasoningEffortSchema.safeParse(value ?? "low");
  if (!parsed.success) return "low";
  return parsed.data;
}
