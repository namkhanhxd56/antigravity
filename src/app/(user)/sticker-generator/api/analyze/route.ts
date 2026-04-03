/**
 * API Route: POST /api/analyze
 *
 * Server-side endpoint that receives a base64 image, calls the Gemini
 * analyzeSticker service, and returns the parsed StickerAnalysis JSON.
 */

import { NextRequest, NextResponse } from "next/server";
import { routeAnalysis } from "../../services/router.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 }
      );
    }

    const apiKey = request.headers.get("x-gemini-api-key") || undefined;
    const modelId = request.headers.get("x-sticker-model") || undefined;

    const analysis = await routeAnalysis(
      imageBase64,
      mimeType || "image/png",
      apiKey,
      modelId
    );

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Analysis failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
