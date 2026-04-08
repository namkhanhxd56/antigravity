/**
 * API Route: POST /content-curator-v2/api/generate
 *
 * V2 variant — accepts keyword section assignments + bulletCount instead of
 * flat keywords string. Skill content includes base rules (no _base/ layer).
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { VertexAI } from "@google-cloud/vertexai";
import fs from "fs";
import path from "path";
import { buildGeneratePromptV2, type LimitsConfigV2 } from "../../lib/promptBuilderV2";
import type { KeywordAssignments } from "../../components/KeywordAssigner";
import { vertexExpressGenerate } from "@/lib/vertex-express";

const SKILLS_DIR = path.join(
  process.cwd(), "src", "app", "(user)", "content-curator", "skills"
);

const DEFAULT_LIMITS: LimitsConfigV2 = {
  title: 200,
  bulletCount: 5,
  bulletItem: 500,
  description: 2000,
  searchTerms: 250,
};

// ─── Skill file cache (shared with v1 — same skills directory) ────────────────

const skillCache = new Map<string, string>();

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

export interface GenerateRequestV2 {
  keywordAssignments: KeywordAssignments;
  /** All keywords not assigned to any zone */
  unassignedKeywords: string[];
  skillName?: string;
  /** Skill content from localStorage (Vercel-safe upload) */
  skillContent?: string;
  bulletCount?: number;
  model?: string;
  notes?: string;
  occasion?: string;
  image?: string;
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequestV2;
    const {
      keywordAssignments,
      unassignedKeywords = [],
      skillName,
      bulletCount = 5,
      model,
      notes,
      occasion,
      image,
    } = body;

    const allKeywords = [
      ...keywordAssignments.title,
      ...keywordAssignments.bullets,
      ...keywordAssignments.description,
      ...unassignedKeywords,
    ];

    if (allKeywords.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one keyword is required" },
        { status: 400 }
      );
    }

    // ─── Credentials ─────────────────────────────────────────────────────────
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
        { success: false, error: "No API credentials found. Configure API key in Settings." },
        { status: 400 }
      );
    }

    const resolvedSkillContent =
      body.skillContent ?? readSkillFile(skillName || "Editorial_Pro_V2.md");

    const prompt = buildGeneratePromptV2({
      limits: DEFAULT_LIMITS,
      skillContent: resolvedSkillContent,
      keywordAssignments: {
        ...keywordAssignments,
        unassigned: unassignedKeywords,
      },
      bulletCount,
      notes,
      occasion,
    });

    let rawResponse = "";

    if (vertexJson) {
      try {
        const credentials = JSON.parse(vertexJson);
        const project = credentials.project_id;
        const vertexAI = new VertexAI({ project, location: "us-central1", googleAuthOptions: { credentials } });
        const vertexModel = vertexAI.getGenerativeModel({
          model: model || "gemini-1.5-flash-002",
          generationConfig: { responseMimeType: "application/json", temperature: 0.75 },
        });
        const vParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: prompt }];
        if (image) {
          const mimeMatch = image.match(/^data:(image\/[a-zA-Z0-9]+);base64,/);
          if (mimeMatch) {
            vParts.unshift({ inlineData: { data: image.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, ""), mimeType: mimeMatch[1] } });
          }
        }
        const result = await vertexModel.generateContent({ contents: [{ role: "user", parts: vParts as any }] });
        rawResponse = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } catch (vErr) {
        throw new Error(`Vertex AI failed: ${vErr instanceof Error ? vErr.message : "Unknown error"}`);
      }
    } else if (vertexApiKey) {
      try {
        const vParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: prompt }];
        if (image) {
          const mimeMatch = image.match(/^data:(image\/[a-zA-Z0-9]+);base64,/);
          if (mimeMatch) {
            vParts.unshift({ inlineData: { data: image.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, ""), mimeType: mimeMatch[1] } });
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
        throw new Error(`Vertex AI Express failed: ${vErr instanceof Error ? vErr.message : "Unknown error"}`);
      }
    } else {
      const genAI = new GoogleGenerativeAI(apiKey!);
      const geminiModel = genAI.getGenerativeModel({
        model: model || "gemini-2.5-flash-lite",
        generationConfig: { responseMimeType: "application/json", temperature: 0.75 },
      });
      const aParts: any[] = [{ text: prompt }];
      if (image) {
        const mimeMatch = image.match(/^data:(image\/[a-zA-Z0-9]+);base64,/);
        if (mimeMatch) {
          aParts.unshift({ inlineData: { data: image.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, ""), mimeType: mimeMatch[1] } });
        }
      }
      const result = await geminiModel.generateContent(aParts);
      rawResponse = result.response.text();
    }

    const cleanJson = rawResponse.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const listing = JSON.parse(cleanJson);

    if (typeof listing.bullets === "string") {
      listing.bullets = listing.bullets
        .split("\n")
        .map((b: string) => b.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean);
    }

    return NextResponse.json({ success: true, listing, _debug: { rawResponse } });
  } catch (error) {
    console.error("[content-curator-v2/generate] error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
