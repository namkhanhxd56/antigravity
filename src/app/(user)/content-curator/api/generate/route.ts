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
import { VertexAI } from "@google-cloud/vertexai";
import fs from "fs";
import path from "path";
import { buildGeneratePrompt, type LimitsConfig } from "../../lib/promptBuilder";
import type { GenerateRequest } from "../../lib/types";
import { vertexExpressGenerate } from "@/lib/vertex-express";

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

    // ─── Resolve credentials ─────────────────────────────────────────────────
    // Priority: browser headers (per-user) → process.env (admin/shared intentional)
    // Stored keys (api-keys.json / /tmp) are intentionally excluded so keys
    // are never shared across browsers.
    const vertexJson =
      request.headers.get("x-curator-vertex-json") ||
      process.env.CURATOR_VERTEX_AI_JSON ||
      process.env.VERTEX_AI_JSON ||
      null;

    const vertexApiKey =
      request.headers.get("x-curator-vertex-key") ||
      process.env.CURATOR_VERTEX_API_KEY ||
      null;

    const apiKey =
      request.headers.get("x-gemini-api-key") ||
      process.env.CURATOR_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      null;

    if (!apiKey && !vertexJson && !vertexApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "No API Credentials found. Please configure Gemini API Key, Vertex AI JSON, or Vertex AI API Key in Settings.",
        },
        { status: 400 }
      );
    }

    // skillContent từ client (user-imported skill lưu trong localStorage) được ưu tiên
    // hơn đọc từ disk — giúp hoạt động trên Vercel (filesystem read-only)
    const resolvedSkillContent =
      body.skillContent ?? readSkillFile(skillName || "Editorial_Pro_V2.md");

    const prompt = buildGeneratePrompt({
      limits: readLimits(),
      baseRules: readBaseRules(),
      skillContent: resolvedSkillContent,
      keywords,
      notes,
      occasion,
    });

    let rawResponse = "";

    if (vertexJson) {
      // ─── Vertex AI Strategy (Service Account JSON) ────────────────────────
      try {
        const credentials = JSON.parse(vertexJson);
        const project = credentials.project_id;
        const vertexAI = new VertexAI({ project, location: "us-central1", googleAuthOptions: { credentials } });

        const vertexModel = vertexAI.getGenerativeModel({
          model: model || "gemini-1.5-flash-002",
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.75,
          },
        });

        const vParts = [{ text: prompt }];
        if (image) {
          const mimeMatch = image.match(/^data:(image\/[a-zA-Z0-9]+);base64,/);
          if (mimeMatch) {
            const mimeType = mimeMatch[1];
            const base64Data = image.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, "");
            vParts.unshift({ inlineData: { data: base64Data, mimeType } } as any);
          }
        }

        const result = await vertexModel.generateContent({
          contents: [{ role: "user", parts: vParts as any }],
        });
        const response = await result.response;
        rawResponse = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } catch (vErr) {
        console.error("Vertex AI Error:", vErr);
        throw new Error(`Vertex AI failed: ${vErr instanceof Error ? vErr.message : "Unknown error"}`);
      }
    } else if (vertexApiKey) {
      // ─── Vertex AI Express Strategy (API Key) ─────────────────────────────
      try {
        const vParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
          { text: prompt },
        ];
        if (image) {
          const mimeMatch = image.match(/^data:(image\/[a-zA-Z0-9]+);base64,/);
          if (mimeMatch) {
            const mimeType = mimeMatch[1];
            const base64Data = image.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, "");
            vParts.unshift({ inlineData: { data: base64Data, mimeType } });
          }
        }

        const vertexResponse = await vertexExpressGenerate(
          vertexApiKey,
          model || "gemini-2.0-flash-001",
          [{ role: "user", parts: vParts }],
          { responseMimeType: "application/json", temperature: 0.75 }
        );
        rawResponse = vertexResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } catch (vErr) {
        console.error("Vertex AI Express Error:", vErr);
        throw new Error(`Vertex AI Express failed: ${vErr instanceof Error ? vErr.message : "Unknown error"}`);
      }
    } else {
      // ─── AI Studio Strategy ───────────────────────────────────────────────
      const genAI = new GoogleGenerativeAI(apiKey!);
      const geminiModel = genAI.getGenerativeModel({
        model: model || "gemini-2.5-flash-lite",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.75,
        },
      });

      const aParts: any[] = [{ text: prompt }];
      if (image) {
        const mimeMatch = image.match(/^data:(image\/[a-zA-Z0-9]+);base64,/);
        if (mimeMatch) {
          const mimeType = mimeMatch[1];
          const base64Data = image.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, "");
          aParts.unshift({ inlineData: { data: base64Data, mimeType } });
        }
      }

      const result = await geminiModel.generateContent(aParts);
      rawResponse = result.response.text();
    }

    const cleanJson = rawResponse
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
      _debug: { rawResponse: rawResponse },
    });
  } catch (error) {
    console.error("[content-curator/generate] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
