/**
 * API Route: POST /content-curator/api/generate-competitor
 *
 * Viết lại listing mới từ content đối thủ + keywords + imageAnalysis.
 * Không dùng skill file — prompt được build trực tiếp tại đây.
 *
 * Body: {
 *   competitorTitle: string,
 *   competitorBullets: string,
 *   competitorDescription: string,
 *   keywords: string[],
 *   imageAnalysis?: object | null,
 *   bulletCount: number,
 *   limits: { title, bulletItem, description },
 *   model?: string,
 * }
 * Response: { success: true, title, bullets, description }
 */

import { NextRequest, NextResponse } from "next/server";
import { callAI, resolveAiHeaders } from "../../lib/aiCall";
import type { ContentLimits } from "../../lib/useContentLimits";
import type { ImageAnalysis } from "../../lib/types";

function buildPrompt({
  competitorTitle,
  competitorBullets,
  competitorDescription,
  keywords,
  imageAnalysis,
  bulletCount,
  limits,
}: {
  competitorTitle: string;
  competitorBullets: string;
  competitorDescription: string;
  keywords: string[];
  imageAnalysis: ImageAnalysis | null;
  bulletCount: number;
  limits: ContentLimits;
}): string {
  const imageSection = imageAnalysis
    ? `PRODUCT IMAGE ANALYSIS:\n${JSON.stringify(imageAnalysis, null, 2)}`
    : "PRODUCT IMAGE ANALYSIS:\nNo image provided.";

  const kwSection = keywords.length > 0
    ? `KEYWORDS TO USE (include as many as possible, each keyword only once):\n${keywords.join(", ")}`
    : "KEYWORDS TO USE:\nNone provided — use natural Amazon SEO language.";

  return `You are an expert Amazon listing copywriter.

TASK: Write a NEW listing inspired by the competitor listing below. Do NOT copy any text directly — rewrite everything original. Use the competitor's structure, tone, and surface mentions as reference only.

---

COMPETITOR LISTING:
Title: ${competitorTitle || "(not provided)"}

Bullet Points:
${competitorBullets || "(not provided)"}

Description:
${competitorDescription || "(not provided)"}

---

${imageSection}

---

${kwSection}

---

REQUIREMENTS:
- Title: max ${limits.title} characters
- Write exactly ${bulletCount} bullet points, each max ${limits.bulletItem} characters
- Description: paragraph format, max ${limits.description} characters
- Do NOT use emoji or special characters (®©™) — Amazon policy
- Integrate provided keywords naturally, each used only once across the full listing
- If image analysis is provided, use it to describe the actual product accurately

OUTPUT: Valid JSON only, no markdown, no explanation:
{"title": "...", "bullets": ["...", "...", "...", "...", "..."], "description": "..."}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      competitorTitle = "",
      competitorBullets = "",
      competitorDescription = "",
      keywords = [],
      imageAnalysis = null,
      bulletCount = 5,
      limits,
      model,
    } = body as {
      competitorTitle?: string;
      competitorBullets?: string;
      competitorDescription?: string;
      keywords?: string[];
      imageAnalysis?: ImageAnalysis | null;
      bulletCount?: number;
      limits?: ContentLimits;
      model?: string;
    };

    const headers = resolveAiHeaders(request);

    if (!headers.apiKey && !headers.vertexJson && !headers.vertexApiKey) {
      return NextResponse.json(
        { success: false, error: "No API credentials. Configure API key in Settings." },
        { status: 400 }
      );
    }

    const effectiveLimits: ContentLimits = limits ?? {
      title: 200,
      bulletItem: 500,
      description: 2000,
      searchTerms: 250,
    };

    const prompt = buildPrompt({
      competitorTitle,
      competitorBullets,
      competitorDescription,
      keywords,
      imageAnalysis,
      bulletCount,
      limits: effectiveLimits,
    });

    const raw = await callAI({
      prompt,
      headers,
      model,
      responseType: "json",
      temperature: 0.8,
    });

    const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    let parsed: { title?: string; bullets?: string[]; description?: string };
    try {
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json(
        { success: false, error: "AI response was not valid JSON. Please try again." },
        { status: 500 }
      );
    }

    const title = (parsed.title ?? "").replace(/^["'`]+|["'`]+$/g, "").trim();
    let bullets: string[] = Array.isArray(parsed.bullets)
      ? parsed.bullets.map((b: string) => b.replace(/^["'`]+|["'`]+$/g, "").trim())
      : [];

    // Pad / trim to exact bulletCount
    while (bullets.length < bulletCount) bullets.push("");
    bullets = bullets.slice(0, bulletCount);

    const description = (parsed.description ?? "").replace(/^["'`]+|["'`]+$/g, "").trim();

    return NextResponse.json({ success: true, title, bullets, description });
  } catch (error) {
    console.error("[generate-competitor] error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
