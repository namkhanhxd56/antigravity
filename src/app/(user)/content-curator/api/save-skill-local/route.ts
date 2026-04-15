/**
 * API Route: POST /content-curator/api/save-skill-local
 *
 * Writes the 3 split skill sections to disk for local inspection.
 * Only works in local development (Vercel filesystem is read-only).
 *
 * Body: { skillName: string, title: string, bullets: string, description: string }
 * Creates: skills/skill_local/skill_title.md, skill_bullets.md, skill_description.md
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { skillName, image, title, bullets, description } = await request.json();

    const dir = path.join(process.cwd(), "src/app/(user)/content-curator/skills/skill_local");

    // Ensure directory exists
    await mkdir(dir, { recursive: true });

    const header = `<!-- Auto-generated from: ${skillName} -->\n\n`;

    await Promise.all([
      writeFile(path.join(dir, "skill_image.md"), header + (image ?? ""), "utf-8"),
      writeFile(path.join(dir, "skill_title.md"), header + (title ?? ""), "utf-8"),
      writeFile(path.join(dir, "skill_bullets.md"), header + (bullets ?? ""), "utf-8"),
      writeFile(path.join(dir, "skill_description.md"), header + (description ?? ""), "utf-8"),
    ]);

    return NextResponse.json({ success: true });
  } catch (e) {
    // Silently fail on Vercel (read-only filesystem)
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg }, { status: 200 });
  }
}
