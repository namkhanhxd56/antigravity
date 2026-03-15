/**
 * API Route: POST /api/generate
 *
 * Server-side endpoint that receives generation parameters, routes to the
 * appropriate model, and returns generated sticker images.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAvailableModels,
  suggestModel,
  routeGeneration,
} from "@/services/ai/router.service";
import type { ModelId } from "@/lib/types";

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

    // Resolve model: auto-suggest or use explicit selection
    let modelId: ModelId;
    if (selectedModel === "auto") {
      modelId = suggestModel({ quote }, !!referenceImage);
    } else {
      modelId = selectedModel as ModelId;
    }

    // Check availability
    const models = getAvailableModels();
    const chosen = models.find((m) => m.id === modelId);
    if (chosen && !chosen.available) {
      return NextResponse.json(
        {
          success: false,
          error: `${chosen.name} is not available. Please set ${chosen.envKey} in .env.local.`,
        },
        { status: 400 }
      );
    }

    // Route to provider
    const result = await routeGeneration(
      { prompt, referenceImage, variations },
      modelId
    );

    return NextResponse.json({
      ...result,
      modelId,
      suggestedModel: selectedModel === "auto" ? modelId : undefined,
    });
  } catch (error) {
    console.error("Generation failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/** GET handler to return available models for the client UI. */
export async function GET() {
  const models = getAvailableModels();
  return NextResponse.json({ models });
}
