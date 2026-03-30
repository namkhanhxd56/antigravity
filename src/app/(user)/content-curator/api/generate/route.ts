/**
 * API Route: POST /content-curator/api/generate
 *
 * Receives keywords + skill profile name + optional notes,
 * builds a prompt, calls Gemini, and returns a structured listing.
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { buildGeneratePrompt } from "../../lib/promptBuilder";
import type { GenerateRequest } from "../../lib/types";

const SKILLS_DIR = path.join(
  process.cwd(),
  "src",
  "app",
  "(user)",
  "content-curator",
  "skills"
);

function readSkillFile(skillName: string): string {
  try {
    const filePath = path.join(SKILLS_DIR, skillName);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8");
    }
  } catch {
    // fall through — skill content is optional
  }
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequest;
    const { keywords, skillName, notes } = body;

    if (!keywords?.trim()) {
      return NextResponse.json(
        { success: false, error: "keywords is required" },
        { status: 400 }
      );
    }

    const apiKey =
      request.headers.get("x-gemini-api-key") ||
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GEMINI_API_KEY is not configured. Add it to .env.local or enter it in Settings.",
        },
        { status: 400 }
      );
    }

    const skillContent = readSkillFile(skillName || "Editorial_Pro_V2.md");
    const prompt = buildGeneratePrompt(skillContent, keywords, notes);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.75,
      },
    });

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    const cleanJson = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const listing = JSON.parse(cleanJson);

    // Ensure bullets is always an array
    if (typeof listing.bullets === "string") {
      listing.bullets = listing.bullets
        .split("\n")
        .map((b: string) => b.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean);
    }

    return NextResponse.json({ success: true, listing });
  } catch (error) {
    console.error("[content-curator/generate] error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
