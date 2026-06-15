import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  DinnerOutcomeSchema,
  DinnerResult,
  FoodTagSchema,
  Meal,
  MealGenerationRequest,
  MealSchema,
  PlatingPreferenceSchema,
  foodPreferenceStatuses,
  splitCsv
} from "../shared/domain.js";
import { AppDatabase } from "./db/database.js";
import {
  HomeAssistantConfigurationError,
  HomeAssistantRequestError,
  getHomeAssistantShoppingList,
  getHomeAssistantTodoEntityId,
  getHomeAssistantUrl,
  isHomeAssistantConfigured,
  sendShoppingListToHomeAssistant
} from "./services/homeAssistantShoppingList.js";
import { createMealAIService, getMealAIProvider } from "./services/mealAIService.js";
import { validateMealGenerationResponse } from "./services/mealValidation.js";
import { buildShoppingList } from "./services/shoppingListBuilder.js";

const ChildInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  age: z.number().int().positive().nullable(),
  notes: z.string().default(""),
  defaultPlatingPreference: PlatingPreferenceSchema,
  allergiesOrRestrictions: z.array(z.string()).default([])
});

const FoodPreferenceInputSchema = z.object({
  childId: z.string().uuid(),
  foodName: z.string().min(1),
  status: z.enum(foodPreferenceStatuses),
  tags: z.array(FoodTagSchema).default([]),
  acceptedFormats: z.array(z.string()).default([]),
  rejectedFormats: z.array(z.string()).default([]),
  notes: z.string().default(""),
  isSafeFallback: z.boolean().default(false),
  isHardNo: z.boolean().default(false)
});

const GenerateMealsInputSchema = z.object({
  numberOfMeals: z.number().int().min(1).max(7),
  maxCookTimeMinutes: z.number().int().positive().nullable(),
  guidance: z.string().default(""),
  availableIngredients: z.array(z.string()),
  avoidIngredients: z.array(z.string()),
  desiredRiskLevels: z.array(z.enum(["safe", "bridge", "stretch", "adultForward"])),
  parentPreferences: z.array(z.string()),
  notes: z.string()
});

const DinnerResultInputSchema = z.object({
  mealId: z.string().uuid(),
  workedWell: z.boolean(),
  overallNotes: z.string().default(""),
  exposureResults: z.array(
    z.object({
      childProfileId: z.string().uuid(),
      childNameSnapshot: z.string(),
      foodName: z.string().min(1),
      format: z.string().default(""),
      outcome: DinnerOutcomeSchema,
      notes: z.string().default("")
    })
  )
});

const ShoppingListInputSchema = z.object({
  mealIds: z.array(z.string().uuid()).min(1),
  title: z.string().min(1).default("Dinner shopping list")
});

const HomeAssistantExportInputSchema = z.object({
  itemIds: z.array(z.string().uuid()).optional()
});

export function createServer(database = AppDatabase.fromEnvironment()) {
  const app = Fastify({ logger: true });
  const mealAI = createMealAIService();
  const mealAIProvider = getMealAIProvider();

  app.register(cors, {
    origin: true
  });

  app.get("/api/health", async () => ({
    ok: true,
    service: "family-meal-planner",
    aiProvider: mealAIProvider,
    homeAssistantConfigured: isHomeAssistantConfigured()
  }));

  app.get("/api/home-assistant", async () => ({
    configured: isHomeAssistantConfigured(),
    url: getHomeAssistantUrl(),
    todoEntityId: getHomeAssistantTodoEntityId()
  }));

  app.get("/api/home-assistant/shopping-list", async (request, reply) => {
    try {
      return { homeAssistant: await getHomeAssistantShoppingList() };
    } catch (error) {
      request.log.error({ error }, "Home Assistant shopping list read failed");
      if (error instanceof HomeAssistantRequestError) {
        return reply.code(502).send({ error: "Could not read the Home Assistant list." });
      }
      return reply.code(502).send({ error: "Could not read the Home Assistant list." });
    }
  });

  app.get("/api/children", async () => ({
    children: database.listChildren()
  }));

  app.post("/api/children", async (request, reply) => {
    const parsed = ChildInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    return { child: database.upsertChild(parsed.data) };
  });

  app.post("/api/children/:id/archive", async (request, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: params.error.flatten() });
    database.archiveChild(params.data.id);
    return { ok: true };
  });

  app.post("/api/food-preferences", async (request, reply) => {
    const parsed = FoodPreferenceInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const child = database.getChild(parsed.data.childId);
    if (!child) return reply.code(404).send({ error: "Child not found" });

    return { foodPreference: database.addFoodPreference(parsed.data) };
  });

  app.get("/api/meals", async () => ({
    meals: database.listMeals()
  }));

  app.get("/api/meals/:id", async (request, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: params.error.flatten() });

    const meal = database.getMeal(params.data.id);
    if (!meal) return reply.code(404).send({ error: "Meal not found" });
    return { meal };
  });

  app.post("/api/generate-meals", async (request, reply) => {
    const parsed = GenerateMealsInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const children = database.listChildren();
    const recentMealNames = database.listMeals().slice(0, 8).map((meal) => meal.name);
    const aiRequest: MealGenerationRequest = {
      family: { children },
      constraints: {
        ...parsed.data,
        recentMealNames
      }
    };

    try {
      const response = await mealAI.generateMealSuggestions(aiRequest);
      const validated = validateMealGenerationResponse(response, children);
      return validated;
    } catch (error) {
      request.log.error({ error }, "Meal generation failed");
      return reply.code(502).send({
        error: "Meal generation failed. Check the backend AI configuration and family food rules."
      });
    }
  });

  app.post("/api/meals", async (request, reply) => {
    const parsed = MealSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    return { meal: database.saveMeal(parsed.data) };
  });

  app.post("/api/dinner-results", async (request, reply) => {
    const parsed = DinnerResultInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const meal = database.getMeal(parsed.data.mealId);
    if (!meal) return reply.code(404).send({ error: "Meal not found" });

    const timestamp = new Date().toISOString();
    const result: DinnerResult = {
      id: randomUUID(),
      mealId: meal.id,
      mealNameSnapshot: meal.name,
      servedAt: timestamp,
      overallNotes: parsed.data.overallNotes,
      workedWell: parsed.data.workedWell,
      createdAt: timestamp,
      exposureResults: parsed.data.exposureResults.map((exposure) => ({
        id: randomUUID(),
        ...exposure
      }))
    };

    return { dinnerResult: database.saveDinnerResult(result) };
  });

  app.get("/api/dinner-results", async () => ({
    dinnerResults: database.listDinnerResults()
  }));

  app.post("/api/shopping-lists", async (request, reply) => {
    const parsed = ShoppingListInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const meals = parsed.data.mealIds
      .map((id) => database.getMeal(id))
      .filter((meal): meal is Meal => Boolean(meal));
    if (meals.length === 0) return reply.code(404).send({ error: "No meals found" });

    return { shoppingList: database.saveShoppingList(buildShoppingList(meals, parsed.data.title)) };
  });

  app.get("/api/shopping-lists", async () => ({
    shoppingLists: database.listShoppingLists()
  }));

  app.post("/api/shopping-lists/:listId/items/:itemId/toggle", async (request, reply) => {
    const params = z
      .object({ listId: z.string().uuid(), itemId: z.string().uuid() })
      .safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: params.error.flatten() });

    const shoppingList = database.toggleShoppingListItem(params.data.listId, params.data.itemId);
    if (!shoppingList) return reply.code(404).send({ error: "Shopping list not found" });
    return { shoppingList };
  });

  app.post("/api/shopping-lists/:listId/export/home-assistant", async (request, reply) => {
    const params = z.object({ listId: z.string().uuid() }).safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: params.error.flatten() });

    const parsed = HomeAssistantExportInputSchema.safeParse(request.body ?? {});
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const shoppingList = database.listShoppingLists().find((list) => list.id === params.data.listId);
    if (!shoppingList) return reply.code(404).send({ error: "Shopping list not found" });

    try {
      return {
        homeAssistant: await sendShoppingListToHomeAssistant(shoppingList, parsed.data)
      };
    } catch (error) {
      request.log.error({ error }, "Home Assistant shopping list export failed");
      if (error instanceof HomeAssistantConfigurationError) {
        return reply.code(503).send({ error: error.message });
      }
      if (error instanceof HomeAssistantRequestError) {
        return reply.code(502).send({ error: "Home Assistant rejected the shopping list export." });
      }
      return reply.code(502).send({ error: "Could not send shopping list to Home Assistant." });
    }
  });

  app.post("/api/meals/:id/export/home-assistant", async (request, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: params.error.flatten() });

    const meal = database.getMeal(params.data.id);
    if (!meal) return reply.code(404).send({ error: "Meal not found" });

    try {
      return {
        homeAssistant: await sendShoppingListToHomeAssistant(
          buildShoppingList([meal], `${meal.name} shopping list`)
        )
      };
    } catch (error) {
      request.log.error({ error }, "Home Assistant meal shopping list export failed");
      if (error instanceof HomeAssistantConfigurationError) {
        return reply.code(503).send({ error: error.message });
      }
      if (error instanceof HomeAssistantRequestError) {
        return reply.code(502).send({ error: "Home Assistant rejected the recipe list export." });
      }
      return reply.code(502).send({ error: "Could not send recipe list to Home Assistant." });
    }
  });

  const distClient = findClientDist();
  if (distClient) {
    app.register(fastifyStatic, {
      cacheControl: false,
      root: distClient,
      prefix: "/",
      setHeaders: (response, filePath) => {
        response.setHeader("Cache-Control", getStaticCacheControl(filePath));
      }
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith("/api")) {
        reply.code(404).send({ error: "Not found" });
        return;
      }
      reply.header("Cache-Control", "no-cache").sendFile("index.html", { cacheControl: false });
    });
  }

  return app;
}

function getStaticCacheControl(filePath: string): string {
  const fileName = path.basename(filePath);

  if (fileName === "version.json") return "no-store";
  if (fileName === "index.html") return "no-cache";
  if (fileName === "sw.js" || fileName === "manifest.webmanifest" || fileName.startsWith("workbox-")) {
    return "no-cache";
  }
  if (filePath.includes(`${path.sep}assets${path.sep}`)) {
    return "public, max-age=31536000, immutable";
  }

  return "public, max-age=3600";
}

function findClientDist(): string | null {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, "../client"),
    path.resolve(process.cwd(), "dist/client")
  ];

  return candidates.find((candidate) => existsSync(path.join(candidate, "index.html"))) ?? null;
}

export function parseCsvBody(value: unknown): string[] {
  return typeof value === "string" ? splitCsv(value) : [];
}
