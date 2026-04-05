/**
 * API Route: POST /sticker-generator/api/generate
 *
 * Key priority (sticker-specific first, then global fallback):
 *   STICKER_VERTEX_AI_JSON > STICKER_VERTEX_API_KEY > STICKER_GEMINI_API_KEY
 *   > VERTEX_AI_JSON > GEMINI_API_KEY
 *
 * Model is sent in request body (not header) to avoid stale closure issues.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAvailableModels, suggestModel, routeGeneration } from "../../services/router.service";
import type { ModelId } from "../../lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      referenceImage,
      variations = 1,
      selectedModel = "auto",
      quote = "",
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    // ─── Resolve credentials ─────────────────────────────────────────────────
    // Priority: browser header (per-user) → process.env (admin/shared intentional)
    // Stored keys (api-keys.json / /tmp) are intentionally excluded so keys
    // are never shared across browsers.
    const resolvedKey =
      request.headers.get("x-sticker-api-key") ||
      process.env.STICKER_VERTEX_AI_JSON ||
      process.env.STICKER_VERTEX_API_KEY ||
      process.env.STICKER_GEMINI_API_KEY ||
      process.env.VERTEX_AI_JSON ||
      process.env.GEMINI_API_KEY ||
      undefined;

    if (!resolvedKey) {
      return NextResponse.json(
        {
          success: false,
          error: "No API credentials configured. Please add a key in Sticker Generator Settings.",
        },
        { status: 400 }
      );
    }

    // ─── Resolve model ──────────────────────────────────────────────────────
    let modelId: ModelId;
    if (selectedModel === "auto") {
      modelId = suggestModel({ quote }, !!referenceImage);
    } else {
      modelId = selectedModel as ModelId;
    }

    // ─── Route generation ───────────────────────────────────────────────────
    const vertexApiKeyHint = request.headers.get("x-sticker-vertex-key") || undefined;

    const result = await routeGeneration(
      { prompt, referenceImage, variations, selectedModel: modelId },
      resolvedKey,
      vertexApiKeyHint
    );

    return NextResponse.json({
      ...result,
      modelId,
      suggestedModel: selectedModel === "auto" ? modelId : undefined,
    });
  } catch (error) {
    console.error("Generation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/** GET handler to return available models for the client UI. */
export async function GET() {
  const models = getAvailableModels();
  return NextResponse.json({ models });
}
