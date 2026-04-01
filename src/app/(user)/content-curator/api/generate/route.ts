/**
 * API Route: POST /content-curator/api/generate
 *
 * Ghép 2 tầng thành prompt hoàn chỉnh, gọi Gemini, trả về structured listing.
 *
 * Caching strategy:
 *   Tầng 1 (limits.json)   — đọc mỗi request (file nhỏ, thay đổi khi admin sửa)
 *   Tầng 2 (product skill) — lazy cache (skillCache), reset bằng /api/reload-skill
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { buildGeneratePrompt, type LimitsConfig } from "../../lib/promptBuilder";
import type { GenerateRequest } from "../../lib/types";

const BASE_DIR = path.join(
  process.cwd(), "src", "app", "(user)", "content-curator", "skills", "_base"
);
const SKILLS_DIR = path.join(
  process.cwd(), "src", "app", "(user)", "content-curator", "skills"
);

const DEFAULT_LIMITS: LimitsConfig = {
  title: 200,
  bulletCount: 5,
  bulletItem: 500,
  description: 2000,
  searchTerms: 250,
};

// ─── Tầng 1: Limits (đọc từ file mỗi request) ────────────────────────────────

function readLimits(): LimitsConfig {
  try {
    const filePath = path.join(BASE_DIR, "limits.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return { ...DEFAULT_LIMITS, ...JSON.parse(raw) };
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_LIMITS;
}

// ─── Tầng 1.5: Base Rules (đọc từ file mỗi request) ──────────────────────────

function readBaseRules(): string {
  try {
    const filePath = path.join(BASE_DIR, "base_rules.md");
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8");
    }
  } catch {
    // fall through
  }
  return "";
}

// ─── Tầng 2: Product Skill (lazy cache — reset bằng clearSkillCache) ─────────

const skillCache = new Map<string, string>();

export function clearSkillCache(skillName?: string) {
  if (skillName) {
    skillCache.delete(skillName);
  } else {
    skillCache.clear();
  }
}

function readSkillFile(skillName: string): string {
  if (skillCache.has(skillName)) return skillCache.get(skillName)!;
  try {
    const filePath = path.join(SKILLS_DIR, skillName);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      skillCache.set(skillName, content);
      return content;
    }
  } catch {
    // fall through
  }
  return "";
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequest;
    const { keywords, skillName, model, notes, occasion, image } = body;

    if (!keywords?.trim()) {
      return NextResponse.json(
        { success: false, error: "keywords is required" },
        { status: 400 }
      );
    }

    const apiKey =
      request.headers.get("x-gemini-api-key") || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY is not configured. Add it to .env.local or enter it in Settings.",
        },
        { status: 400 }
      );
    }

    const prompt = buildGeneratePrompt({
      limits: readLimits(),
      baseRules: readBaseRules(),
      skillContent: readSkillFile(skillName || "Editorial_Pro_V2.md"),
      keywords,
      notes,
      occasion,
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
      model: model || "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.75,
      },
    });

    const parts: any[] = [{ text: prompt }];

    if (image) {
      // image is a base64 Data URL (e.g., "data:image/jpeg;base64,...")
      const mimeMatch = image.match(/^data:(image\/[a-zA-Z0-9]+);base64,/);
      if (mimeMatch) {
        const mimeType = mimeMatch[1];
        const base64Data = image.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, "");
        // Insert inlineData at the beginning so the AI "sees" the image first
        parts.unshift({
          inlineData: {
            data: base64Data,
            mimeType,
          },
        });
      }
    }

    const result = await geminiModel.generateContent(parts);
    const raw = result.response.text();

    const cleanJson = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const listing = JSON.parse(cleanJson);

    if (typeof listing.bullets === "string") {
      listing.bullets = listing.bullets
        .split("\n")
        .map((b: string) => b.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean);
    }

    return NextResponse.json({
      success: true,
      listing,
      _debug: { rawResponse: raw },
    });
  } catch (error) {
    console.error("[content-curator/generate] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
