/**
 * API Route: POST /api/analyze
 *
 * Server-side endpoint that receives a base64 image, calls the Gemini
 * analyzeSticker service, and returns the parsed StickerAnalysis JSON.
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeSticker } from "@/services/ai/gemini.service";

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

    const analysis = await analyzeSticker(
      imageBase64,
      mimeType || "image/png"
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
