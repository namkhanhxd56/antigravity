/**
 * AI Router Service
 *
 * Routes sticker requests to the correct AI provider based on explicit key type.
 * Key type is provided by the client (from localStorage) — no server-side storage lookup.
 */

import type {
  ModelId,
  ModelConfig,
  StickerFormState,
  StickerGenerationRequest,
  StickerGenerationResponse,
} from "../lib/types";
import type { StickerKeyType } from "../lib/sticker-keys";
import { geminiProvider } from "./gemini.service";
import { vertexProvider } from "./vertex.service";
import { vertexApiKeyProvider } from "./vertexApiKey.service";

// ─── Model Registry ──────────────────────────────────────────────────────────

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
 * Returns all models. All models are marked available — the route will fail with a
 * clear error if no credentials are configured. The client controls visibility via
 * its own key check.
 */
export function getAvailableModels(): ModelConfig[] {
  return MODEL_REGISTRY.map((m) => ({ ...m, available: true }));
}

/**
 * Auto-suggests the best available image generation model.
 */
export function suggestModel(
  formState: Pick<StickerFormState, "quote">,
  hasReferenceImage: boolean
): ModelId {
  // Prefer fastest default model
  return "gemini-flash-image";
}

// ─── Model Name Normalization ─────────────────────────────────────────────────

const VERTEX_SDK_MODEL_MAP: Record<string, string> = {
  "gemini-1.5-flash":                 "gemini-1.5-flash-002",
  "gemini-2.0-flash":                 "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite":            "gemini-2.0-flash-lite-001",
  "gemini-flash-image":               "gemini-1.5-flash-002",
  "gemini-2.5-flash-image":           "gemini-2.0-flash-001",
  "gemini-2.5-flash-preview-09-2025": "gemini-2.0-flash-001",
};

function normalizeModelForVertexExpressText(modelId?: string): string {
  if (modelId === "gemini-2.5-flash") return "gemini-2.5-flash";
  return "gemini-2.5-flash-lite";
}

function normalizeModelForVertexExpressImage(modelId?: string): string {
  if (modelId === "gemini-2.0-flash-001") return "gemini-3-pro-image-preview";
  if (modelId === "gemini-2.5-flash-image") return "gemini-2.5-flash-image";
  return "gemini-3.1-flash-image-preview";
}

function normalizeModelForVertexSdk(modelId?: string): string {
  if (!modelId) return "gemini-2.0-flash-001";
  return VERTEX_SDK_MODEL_MAP[modelId] ?? modelId;
}

// ─── Provider Selection ───────────────────────────────────────────────────────

function getProvider(keyType: StickerKeyType) {
  if (keyType === "vertex-json") return vertexProvider;
  if (keyType === "vertex") return vertexApiKeyProvider;
  return geminiProvider;
}

function resolveModel(
  provider: ReturnType<typeof getProvider>,
  modelId?: string,
  purpose: "text" | "image" = "text"
): string | undefined {
  if (provider.name === "Gemini") return modelId;
  if (provider.name === "Vertex AI (API Key)") {
    return purpose === "image"
      ? normalizeModelForVertexExpressImage(modelId)
      : normalizeModelForVertexExpressText(modelId);
  }
  // Vertex AI SDK
  return normalizeModelForVertexSdk(modelId);
}

// ─── Route Functions ──────────────────────────────────────────────────────────

export async function routeAnalysis(
  imageBase64: string,
  mimeType: string,
  key: string,
  keyType: StickerKeyType,
  modelId?: string
) {
  const provider = getProvider(keyType);
  return provider.analyzeSticker(imageBase64, mimeType, key, resolveModel(provider, modelId, "text"));
}

export async function routeRefinement(
  currentState: any,
  modifications: string,
  key: string,
  keyType: StickerKeyType,
  modelId?: string
) {
  const provider = getProvider(keyType);
  return provider.refineAnalysis(currentState, modifications, key, resolveModel(provider, modelId, "text"));
}

export async function routeGeneration(
  request: StickerGenerationRequest,
  key: string,
  keyType: StickerKeyType
): Promise<StickerGenerationResponse> {
  const modelId = (request.selectedModel as ModelId) || "gemini-flash-image";
  const provider = getProvider(keyType);
  const normalizedRequest = { ...request, selectedModel: resolveModel(provider, modelId, "image") };
  return provider.generateSticker(normalizedRequest, key);
}
