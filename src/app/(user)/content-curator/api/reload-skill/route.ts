/**
 * API Route: POST /content-curator/api/reload-skill
 *
 * Clears the in-memory cache for a specific skill (or all skills),
 * so the next generate request will re-read from disk.
 *
 * Body: { skillName?: string }  — omit to clear all skills
 */

import { NextRequest, NextResponse } from "next/server";
import { clearSkillCache } from "../generate/route";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { skillName } = body as { skillName?: string };

  clearSkillCache(skillName);

  return NextResponse.json({
    success: true,
    message: skillName
      ? `Cache cleared for skill: ${skillName}`
      : "All skill caches cleared",
  });
}
