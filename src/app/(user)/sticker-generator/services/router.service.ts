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
} from "../lib/types";
import { resolveApiKey, type ProviderKey } from "@/lib/key-storage";
import { geminiProvider } from "./gemini.service";
import { vertexProvider } from "./vertex.service";

// ─── Model Registry ──────────────────────────────────────────────────────────

const MODEL_REGISTRY: Omit<ModelConfig, "available">[] = [
  {
    id: "gemini-flash-image",
    name: "Gemini 1.5 Flash (AI Studio)",
    description: "Standard API Key access via AI Studio",
    envKey: "GEMINI_API_KEY",
    strengths: ["speed", "multi-image", "default"],
  },
  {
    id: "gemini-1.5-flash-002",
    name: "Gemini 1.5 Flash (v2)",
    description: "Standard Flash model (v2)",
    envKey: "GEMINI_API_KEY",
    strengths: ["speed", "default"],
  },
  {
    id: "gemini-2.0-flash-lite-001",
    name: "Gemini 2.0 Flash-Lite (001)",
    description: "Ultra-fast Next Gen Flash",
    envKey: "GEMINI_API_KEY",
    strengths: ["speed", "multimodal"],
  },
  {
    id: "gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash (001)",
    description: "High-performance Next Gen Flash",
    envKey: "GEMINI_API_KEY",
    strengths: ["quality", "speed"],
  },
  {
    id: "gemini-2.5-flash-image",
    name: "Gemini 2.5 Flash-Image",
    description: "Latest 2.5 Flash for image generation",
    envKey: "GEMINI_API_KEY",
    strengths: ["quality", "latest"],
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash-Lite",
    description: "Lightweight 2.5 Flash",
    envKey: "GEMINI_API_KEY",
    strengths: ["speed", "lite"],
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Balanced 2.5 Flash",
    envKey: "GEMINI_API_KEY",
    strengths: ["performance"],
  },
  {
    id: "gemini-2.5-flash-preview-09-2025",
    name: "Gemini 2.5 Flash (Preview)",
    description: "Preview version of 2.5 Flash",
    envKey: "GEMINI_API_KEY",
    strengths: ["experimental"],
  },
  {
    id: "vertex-gemini-flash",
    name: "Gemini 1.5 Flash (Vertex AI)",
    description: "Enterprise access via GCP Service Account",
    envKey: "VERTEX_AI_JSON",
    strengths: ["enterprise", "secure", "vertex"],
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
  modelId: ModelId,
  clientApiKey?: string
): StickerGenerationResponse | null {
  if (clientApiKey) return null; // Guard passed if user provided key

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

function isVertexJson(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.startsWith("{") && trimmed.endsWith("}");
}

/**
 * Selection Logic: Prefer Vertex AI if available, else Gemini API.
 * SMART: If the provided key looks like JSON, force Vertex provider.
 */
function getPreferredProvider(clientApiKey?: string) {
  if (isVertexJson(clientApiKey)) return vertexProvider;
  
  const geminiKey = resolveApiKey("STICKER_GEMINI_API_KEY" as any) || resolveApiKey("GEMINI_API_KEY");
  if (isVertexJson(geminiKey)) return vertexProvider;

  const isVertex = !!(resolveApiKey("STICKER_VERTEX_AI_JSON" as any) || resolveApiKey("VERTEX_AI_JSON"));
  return isVertex ? vertexProvider : geminiProvider;
}

function getProviderKey(providerName: string, clientApiKey?: string): string | undefined {
  if (isVertexJson(clientApiKey)) return clientApiKey;

  if (providerName === "Vertex AI") {
    return resolveApiKey("STICKER_VERTEX_AI_JSON" as any) || resolveApiKey("VERTEX_AI_JSON");
  }
  return resolveApiKey("STICKER_GEMINI_API_KEY" as any) || resolveApiKey("GEMINI_API_KEY");
}

export async function routeAnalysis(
  imageBase64: string,
  mimeType?: string,
  clientApiKey?: string,
  modelId?: string
) {
  const provider = getPreferredProvider(clientApiKey);
  const key = clientApiKey || getProviderKey(provider.name, clientApiKey);
  return provider.analyzeSticker(imageBase64, mimeType, key, modelId);
}

export async function routeRefinement(
  currentState: any,
  modifications: string,
  clientApiKey?: string,
  modelId?: string
) {
  const provider = getPreferredProvider(clientApiKey);
  const key = clientApiKey || getProviderKey(provider.name, clientApiKey);
  return provider.refineAnalysis(currentState, modifications, key, modelId);
}

export async function routeGeneration(
  request: StickerGenerationRequest,
  apiKey?: string
): Promise<StickerGenerationResponse> {
  const modelId = (request.selectedModel as ModelId) || "gemini-flash-image";
  const guardResult = guardApiKey(modelId, apiKey);
  if (guardResult) return guardResult;

  switch (modelId) {
    case "vertex-gemini-flash":
      return vertexProvider.generateSticker(
        request,
        apiKey || resolveApiKey("VERTEX_AI_JSON")
      );

    case "gemini-flash-image":
    case "gemini-1.5-flash":
    case "gemini-2.0-flash":
    case "gemini-2.0-flash-lite":
    case "gemini-2.0-flash-lite-001":
    case "gemini-2.0-flash-001":
    case "gemini-2.5-flash-image":
    case "gemini-2.5-flash-lite":
    case "gemini-2.5-flash":
    case "gemini-2.5-flash-preview-09-2025": {
      const provider = getPreferredProvider(apiKey);
      const providerKey = apiKey || getProviderKey(provider.name, apiKey);
      return provider.generateSticker(request, providerKey);
    }

    case "ideogram-2":
    case "dall-e-3":
      return {
        success: false,
        modelId,
        error: `${modelId} generation is not yet implemented.`,
      };

    default:
      return {
        success: false,
        error: `Unknown model: ${modelId}`,
      };
  }
}
