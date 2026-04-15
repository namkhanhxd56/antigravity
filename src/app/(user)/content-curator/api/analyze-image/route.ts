/**
 * API Route: POST /content-curator/api/analyze-image
 *
 * Step 0 — Phân tích ảnh sản phẩm. Chạy 1 lần duy nhất, kết quả truyền cho
 * tất cả các bước sau. Không phân tích lại ở step 1-3.
 *
 * Body: { image: string (base64 data URL) }
 * Response: { success: true, analysis: ImageAnalysis }
 */

import { NextRequest, NextResponse } from "next/server";
import { callAI, resolveAiHeaders } from "../../lib/aiCall";
import { buildImageAnalysisPrompt } from "../../lib/promptBuilderV3";

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: "image is required" },
        { status: 400 }
      );
    }

    const headers = resolveAiHeaders(request);

    if (!headers.apiKey && !headers.vertexJson && !headers.vertexApiKey) {
      return NextResponse.json(
        { success: false, error: "No API credentials. Configure API key in Settings." },
        { status: 400 }
      );
    }

    const model = request.headers.get("x-curator-model") || null;
    const prompt = buildImageAnalysisPrompt();

    const rawResponse = await callAI({
      prompt,
      image,
      model,
      headers,
      responseType: "json",
      temperature: 0.3, // Low temp for factual image analysis
    });

    const clean = rawResponse
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    let analysis: object;
    try {
      analysis = JSON.parse(clean);
    } catch {
      // AI không trả về JSON — wrap lại dạng raw text
      analysis = { raw: rawResponse.trim() };
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("[analyze-image] error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
