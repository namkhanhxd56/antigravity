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
import { vertexApiKeyProvider } from "./vertexApiKey.service";

// ─── Model Registry ──────────────────────────────────────────────────────────
// Only models that support image generation via responseModalities: ["IMAGE"]

const MODEL_REGISTRY: Omit<ModelConfig, "available">[] = [
  {
    id: "gemini-flash-image",
    name: "Gemini 3.1 Flash Image (Preview)",
    description: "Fast image generation — Vertex Express",
    envKey: "GEMINI_API_KEY",
    strengths: ["speed", "default"],
  },
  {
    id: "gemini-2.5-flash-image",
    name: "Gemini 2.5 Flash Image",
    description: "Balanced quality & speed — AI Studio & Vertex",
    envKey: "GEMINI_API_KEY",
    strengths: ["balanced"],
  },
  {
    id: "gemini-2.0-flash-001",
    name: "Gemini 3 Pro Image (Preview)",
    description: "High-quality image generation — Vertex Express",
    envKey: "GEMINI_API_KEY",
    strengths: ["quality", "latest"],
  },
];

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns all models with availability flag based on API key presence.
 * Checks sticker-specific keys first, then falls back to global keys.
 */
export function getAvailableModels(): ModelConfig[] {
  const hasGemini = !!(
    resolveApiKey("STICKER_GEMINI_API_KEY") ||
    resolveApiKey("GEMINI_API_KEY")
  );
  const hasVertex = !!(
    resolveApiKey("STICKER_VERTEX_AI_JSON" as ProviderKey) ||
    resolveApiKey("VERTEX_AI_JSON") ||
    resolveApiKey("STICKER_VERTEX_API_KEY" as ProviderKey)
  );

  return MODEL_REGISTRY.map((m) => {
    let available = false;
    if (m.envKey === "GEMINI_API_KEY") {
      available = hasGemini || hasVertex; // Vertex can serve all Gemini models
    } else if (m.envKey === "VERTEX_AI_JSON") {
      available = hasVertex;
    } else {
      available = !!resolveApiKey(m.envKey as ProviderKey);
    }
    return { ...m, available };
  });
}

/**
 * Auto-suggests the best available image generation model.
 * Falls back to first available model or gemini-flash-image.
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

  // Prefer gemini-flash-image (fastest, default image gen model)
  if (isAvailable("gemini-flash-image")) {
    return "gemini-flash-image";
  }

  // Fallback: first available model
  return available[0].id;
}

/**
 * Vertex AI SDK (Service Account) — requires versioned names.
 * e.g. gemini-1.5-flash → gemini-1.5-flash-002
 */
const VERTEX_SDK_MODEL_MAP: Record<string, string> = {
  "gemini-1.5-flash":                  "gemini-1.5-flash-002",
  "gemini-2.0-flash":                  "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite":             "gemini-2.0-flash-lite-001",
  "gemini-flash-image":                "gemini-1.5-flash-002",
  "gemini-2.5-flash-image":            "gemini-2.0-flash-001",
  "gemini-2.5-flash-preview-09-2025":  "gemini-2.0-flash-001",
};

/**
 * Vertex AI Express — text/analysis: only gemini-2.5-* work.
 * Default to gemini-2.5-flash-lite (confirmed fast & available).
 */
function normalizeModelForVertexExpressText(modelId?: string): string {
  if (modelId === "gemini-2.5-flash") return "gemini-2.5-flash";
  return "gemini-2.5-flash-lite";
}

/**
 * Vertex AI Express — image generation.
 * gemini-flash-image       → gemini-3.1-flash-image-preview (fast)
 * gemini-2.5-flash-image   → gemini-2.5-flash-image (pass-through)
 * gemini-2.0-flash-001     → gemini-3-pro-image-preview (quality)
 */
function normalizeModelForVertexExpressImage(modelId?: string): string {
  if (modelId === "gemini-2.0-flash-001") return "gemini-3-pro-image-preview";
  if (modelId === "gemini-2.5-flash-image") return "gemini-2.5-flash-image";
  return "gemini-3.1-flash-image-preview";
}

function normalizeModelForVertexSdk(modelId?: string): string {
  if (!modelId) return "gemini-2.0-flash-001";
  return VERTEX_SDK_MODEL_MAP[modelId] ?? modelId;
}

function isVertexJson(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.startsWith("{") && trimmed.endsWith("}");
}

/**
 * Detects provider from the already-resolved key passed by the route handler.
 * Key resolution priority is handled upstream in each API route.
 *
 * - JSON string → Vertex AI (Service Account)
 * - Regular API key but STICKER_VERTEX_API_KEY is stored → Vertex AI (API Key)
 * - Otherwise → Gemini
 */
function getPreferredProvider(resolvedKey?: string) {
  if (isVertexJson(resolvedKey)) return vertexProvider;

  // If the key matches what's stored as a Vertex API key, use Vertex Express
  const storedVertexApiKey = resolveApiKey("STICKER_VERTEX_API_KEY" as ProviderKey);
  if (storedVertexApiKey && resolvedKey === storedVertexApiKey) return vertexApiKeyProvider;

  return geminiProvider;
}

function resolveModel(
  provider: ReturnType<typeof getPreferredProvider>,
  modelId?: string,
  purpose: "text" | "image" = "text"
): string | undefined {
  if (provider.name === "Gemini") return modelId;
  if (provider.name === "Vertex AI (API Key)") {
    return purpose === "image"
      ? normalizeModelForVertexExpressImage(modelId)
      : normalizeModelForVertexExpressText(modelId);
  }
  return normalizeModelForVertexSdk(modelId); // "Vertex AI" — SDK
}

export async function routeAnalysis(
  imageBase64: string,
  mimeType?: string,
  resolvedKey?: string,
  modelId?: string
) {
  const provider = getPreferredProvider(resolvedKey);
  return provider.analyzeSticker(imageBase64, mimeType, resolvedKey, resolveModel(provider, modelId, "text"));
}

export async function routeRefinement(
  currentState: any,
  modifications: string,
  resolvedKey?: string,
  modelId?: string
) {
  const provider = getPreferredProvider(resolvedKey);
  return provider.refineAnalysis(currentState, modifications, resolvedKey, resolveModel(provider, modelId, "text"));
}

export async function routeGeneration(
  request: StickerGenerationRequest,
  apiKey?: string
): Promise<StickerGenerationResponse> {
  const modelId = (request.selectedModel as ModelId) || "gemini-flash-image";

  const provider = getPreferredProvider(apiKey);
  const normalizedRequest = { ...request, selectedModel: resolveModel(provider, modelId, "image") };
  return provider.generateSticker(normalizedRequest, apiKey);
}
