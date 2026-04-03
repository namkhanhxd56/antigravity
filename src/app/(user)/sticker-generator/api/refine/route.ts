/**
 * API Route: POST /api/refine
 *
 * Server-side endpoint to take existing StickerAnalysis and a string of
 * user modifications, and return an intelligently updated JSON object.
 */

import { NextRequest, NextResponse } from "next/server";
import { routeRefinement } from "../../services/router.service";
import type { StickerAnalysis } from "../../lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentState, modifications } = body as {
      currentState: StickerAnalysis;
      modifications: string;
    };

    if (!currentState || !modifications) {
      return NextResponse.json(
        { error: "currentState and modifications are required" },
        { status: 400 }
      );
    }

    const apiKey = request.headers.get("x-gemini-api-key") || undefined;
    const modelId = request.headers.get("x-sticker-model") || undefined;

    const refinedAnalysis = await routeRefinement(
      currentState,
      modifications,
      apiKey,
      modelId
    );

    return NextResponse.json({ success: true, analysis: refinedAnalysis });
  } catch (error) {
    console.error("Refine analysis failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
