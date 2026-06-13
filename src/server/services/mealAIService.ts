import { MealGenerationRequest, MealGenerationResponse } from "../../shared/domain.js";
import { MockMealAIService } from "./mockMealAI.js";
import { OpenAIMealAIService } from "./openAIMealAI.js";

export interface MealAIService {
  generateMealSuggestions(request: MealGenerationRequest): Promise<MealGenerationResponse>;
}

export type MealAIProvider = "mock" | "openai";

export function getMealAIProvider(): MealAIProvider {
  const configured = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (configured === "mock" || configured === "openai") return configured;
  if (configured) throw new Error(`Unsupported AI_PROVIDER "${process.env.AI_PROVIDER}". Use "mock" or "openai".`);
  return process.env.OPENAI_API_KEY ? "openai" : "mock";
}

export function createMealAIService(): MealAIService {
  const provider = getMealAIProvider();
  if (provider === "openai") return new OpenAIMealAIService();
  return new MockMealAIService();
}
