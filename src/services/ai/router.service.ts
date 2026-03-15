/**
 * AI Router Service
 *
 * Orchestrates which AI provider to use for sticker generation.
 * Checks API keys at runtime to determine model availability,
 * and provides auto-suggest logic based on form state.
 *
 * API Guard: Before routing to any provider, verifies the corresponding
 * API key exists. Returns "Provider not configured" instead of crashing.
 */

import type {
  ModelId,
  ModelConfig,
  StickerFormState,
  StickerGenerationRequest,
  StickerGenerationResponse,
} from "@/lib/types";
import { resolveApiKey, type ProviderKey } from "@/lib/key-storage";
import { geminiProvider } from "./gemini.service";

// ─── Model Registry ──────────────────────────────────────────────────────────

const MODEL_REGISTRY: Omit<ModelConfig, "available">[] = [
  {
    id: "gemini-flash-image",
    name: "Gemini 3 Flash Image",
    description: "Nano Banana 2 — fast text-to-image & image-to-image",
    envKey: "GEMINI_API_KEY",
    strengths: ["speed", "multi-image", "default"],
  },
  {
    id: "ideogram-2",
    name: "Ideogram 2.0",
    description: "Best typography and text rendering",
    envKey: "IDEOGRAM_API_KEY",
    strengths: ["typography", "text-heavy"],
  },
  {
    id: "dall-e-3",
    name: "DALL·E 3",
    description: "Creative and artistic compositions",
    envKey: "OPENAI_API_KEY",
    strengths: ["creative", "artistic"],
  },
];

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns all models with availability flag based on API key presence.
 * Checks both process.env (.env.local) AND stored keys (Settings page).
 */
export function getAvailableModels(): ModelConfig[] {
  return MODEL_REGISTRY.map((m) => ({
    ...m,
    available: !!resolveApiKey(m.envKey as ProviderKey),
  }));
}

/**
 * API Guard — checks if the chosen model's API key is configured.
 * Returns an error response if not, preventing 404/crash.
 */
function guardApiKey(
  modelId: ModelId
): StickerGenerationResponse | null {
  const models = getAvailableModels();
  const model = models.find((m) => m.id === modelId);

  if (!model) {
    return {
      success: false,
      error: `Unknown model: ${modelId}`,
    };
  }

  if (!model.available) {
    return {
      success: false,
      modelId,
      error: `Provider not configured — ${model.name} requires ${model.envKey} in .env.local. Please add the API key and restart the server.`,
    };
  }

  return null; // Guard passed
}

/**
 * Auto-suggests the best model based on form state.
 *
 * Rules:
 * 1. quote.length > 15 → prefer Ideogram (strong typography)
 * 2. referenceImage exists → prefer Gemini (multi-image-to-image)
 * 3. Default → Gemini (speed)
 *
 * Falls back to first available model if preferred one has no API key.
 */
export function suggestModel(
  formState: Pick<StickerFormState, "quote">,
  hasReferenceImage: boolean
): ModelId {
  const models = getAvailableModels();
  const available = models.filter((m) => m.available);

  if (available.length === 0) {
    return "gemini-flash-image"; // fallback even if unavailable
  }

  const isAvailable = (id: ModelId) => available.some((m) => m.id === id);

  // Rule 1: Long quote → prefer Ideogram for typography
  if (formState.quote.length > 15 && isAvailable("ideogram-2")) {
    return "ideogram-2";
  }

  // Rule 2: Reference image → prefer Gemini for multi-image
  if (hasReferenceImage && isAvailable("gemini-flash-image")) {
    return "gemini-flash-image";
  }

  // Rule 3: Default → Gemini for speed
  if (isAvailable("gemini-flash-image")) {
    return "gemini-flash-image";
  }

  // Fallback: first available model
  return available[0].id;
}

/**
 * Routes a generation request to the chosen model's provider.
 * Runs API guard first — returns error if API key is missing.
 */
export async function routeGeneration(
  request: StickerGenerationRequest,
  modelId: ModelId
): Promise<StickerGenerationResponse> {
  // ── API Guard: check key before calling any provider ──
  const guardResult = guardApiKey(modelId);
  if (guardResult) {
    return guardResult;
  }

  switch (modelId) {
    case "gemini-flash-image":
      return geminiProvider.generateSticker(request);

    case "ideogram-2":
      return {
        success: false,
        modelId: "ideogram-2",
        error:
          "Ideogram 2.0 generation is not yet implemented. Please select another model.",
      };

    case "dall-e-3":
      return {
        success: false,
        modelId: "dall-e-3",
        error:
          "DALL·E 3 generation is not yet implemented. Please select another model.",
      };

    default:
      return {
        success: false,
        error: `Unknown model: ${modelId}`,
      };
  }
}
