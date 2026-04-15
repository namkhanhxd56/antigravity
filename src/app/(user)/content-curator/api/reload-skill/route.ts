/**
 * API Route: POST /content-curator/api/reload-skill
 *
 * No-op in V3 pipeline — skill content is passed directly from client
 * (stored in localStorage) so there is no server-side skill cache to clear.
 * Kept for backwards compatibility with SkillConfig's reload button.
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ success: true, message: "No server cache in V3 pipeline." });
}
