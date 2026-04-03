/**
 * API Route: POST /sticker-generator/api/refine
 *
 * Key priority (sticker-specific first, then global fallback):
 *   STICKER_VERTEX_AI_JSON > STICKER_VERTEX_API_KEY > STICKER_GEMINI_API_KEY
 *   > VERTEX_AI_JSON > GEMINI_API_KEY
 */

import { NextRequest, NextResponse } from "next/server";
import { readStoredKeys } from "@/lib/key-storage";
import { routeRefinement } from "../../services/router.service";
import type { StickerAnalysis } from "../../lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentState, modifications, model } = body as {
      currentState: StickerAnalysis;
      modifications: string;
      model?: string;
    };

    if (!currentState || !modifications) {
      return NextResponse.json(
        { error: "currentState and modifications are required" },
        { status: 400 }
      );
    }

    // ─── Resolve credentials — sticker-specific first, global as fallback ──
    const storedKeys = readStoredKeys();

    const resolvedKey =
      storedKeys.STICKER_VERTEX_AI_JSON ||
      process.env.STICKER_VERTEX_AI_JSON ||
      storedKeys.STICKER_VERTEX_API_KEY ||
      process.env.STICKER_VERTEX_API_KEY ||
      storedKeys.STICKER_GEMINI_API_KEY ||
      process.env.STICKER_GEMINI_API_KEY ||
      storedKeys.VERTEX_AI_JSON ||
      process.env.VERTEX_AI_JSON ||
      storedKeys.GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      undefined;

    if (!resolvedKey) {
      return NextResponse.json(
        { success: false, error: "No API credentials configured. Please add a key in Sticker Generator Settings." },
        { status: 400 }
      );
    }

    const refinedAnalysis = await routeRefinement(
      currentState,
      modifications,
      resolvedKey,
      model
    );

    return NextResponse.json({ success: true, analysis: refinedAnalysis });
  } catch (error) {
    console.error("Refine analysis failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
