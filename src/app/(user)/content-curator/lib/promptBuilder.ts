import type { ContentListing } from "./types";

/**
 * Builds the full prompt for initial listing generation.
 * Combines skill profile instructions + keywords + optional notes.
 */
export function buildGeneratePrompt(
  skillContent: string,
  keywords: string,
  notes?: string
): string {
  const parts: string[] = [];

  if (skillContent.trim()) {
    parts.push(`[SKILL PROFILE — FOLLOW THESE INSTRUCTIONS EXACTLY]\n${skillContent.trim()}`);
  }

  parts.push(`[KEYWORDS TO INCORPORATE]\n${keywords.trim()}`);

  if (notes?.trim()) {
    parts.push(`[SELLER NOTES — USP, AUDIENCE, TONE OVERRIDES]\n${notes.trim()}`);
  }

  parts.push(`[OUTPUT TASK]
Generate a complete, publish-ready Amazon product listing based on all the above.
Use the keywords naturally throughout — do not keyword-stuff.
Return ONLY a valid JSON object with this exact shape (no markdown, no explanation):
{
  "title": "string — max 200 characters",
  "bullets": ["string", "string", "string", "string", "string"],
  "description": "string — max 1000 characters",
  "searchTerms": "string — lowercase space-separated, max 250 characters"
}
The "bullets" array must have exactly 5 items.`);

  return parts.join("\n\n---\n\n");
}

/**
 * Builds a prompt for rewriting a single section.
 * Used by the rewrite API route (Sprint 2).
 */
export function buildRewritePrompt(
  section: keyof ContentListing,
  currentValue: string | string[],
  instruction: string,
  skillContent?: string
): string {
  const parts: string[] = [];

  if (skillContent?.trim()) {
    parts.push(`[SKILL PROFILE]\n${skillContent.trim()}`);
  }

  const valueStr =
    Array.isArray(currentValue)
      ? currentValue.map((b, i) => `${i + 1}. ${b}`).join("\n")
      : currentValue;

  parts.push(`[CURRENT ${section.toUpperCase()}]\n${valueStr}`);
  parts.push(`[REWRITE INSTRUCTION]\n${instruction}`);

  const outputShape =
    section === "bullets"
      ? `{ "bullets": ["string", "string", "string", "string", "string"] }`
      : `{ "${section}": "string" }`;

  parts.push(`Return ONLY valid JSON: ${outputShape}`);

  return parts.join("\n\n---\n\n");
}
