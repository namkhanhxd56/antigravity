import type { KeywordAssignments } from "../components/KeywordAssigner";

export interface LimitsConfigV2 {
  title: number;
  bulletCount: number;
  bulletItem: number;
  description: number;
  searchTerms: number;
}

export interface PromptLayersV2 {
  limits: LimitsConfigV2;
  /** Skill .md content (includes base rules — merged) */
  skillContent: string;
  /** Keywords split by section; unassigned = use naturally anywhere */
  keywordAssignments: KeywordAssignments & { unassigned: string[] };
  /** Number of bullet points to generate */
  bulletCount: number;
  notes?: string;
  occasion?: string;
}

export function buildGeneratePromptV2(layers: PromptLayersV2): string {
  const { limits, skillContent, keywordAssignments, bulletCount, notes, occasion } = layers;
  const parts: string[] = [];

  // --- 1. Image analysis ---
  parts.push(
    `[IMAGE ANALYSIS TASK]\n` +
    `If an image is attached to this prompt, carefully analyze it to extract visual details (materials, colors, target audience, aesthetic, unique features). Present a brief analysis before writing the listing, then incorporate those insights naturally.`
  );

  // --- 2. Skill (includes base rules) ---
  if (skillContent.trim()) {
    parts.push(`[PRODUCT SKILL / FORMULAS]\n${skillContent.trim()}`);
  }

  // --- 3. Notes ---
  if (notes?.trim()) {
    parts.push(`[SELLER NOTES — ADDITIONAL CONTEXT, AUDIENCE, OR OVERRIDES]\n${notes.trim()}`);
  }

  // --- 4. Occasion ---
  if (occasion?.trim()) {
    parts.push(
      `[CAMPAIGN / CUSTOMIZATION CONTEXT]\n` +
      `Optimize this listing for: ${occasion}. Adjust tone, urgency, seasonal angle, and gift-giving language accordingly.`
    );
  }

  // --- 5. Keyword section assignments ---
  const kwLines: string[] = ["[KEYWORD SECTION ASSIGNMENTS]"];
  kwLines.push(
    "Follow these assignments strictly. A keyword assigned to a section MUST appear in that section. " +
    "A keyword used in any section must NOT be repeated in another section (Amazon indexes all fields)."
  );

  if (keywordAssignments.title.length > 0) {
    kwLines.push(`TITLE (must appear in title): ${keywordAssignments.title.join(", ")}`);
  }
  if (keywordAssignments.bullets.length > 0) {
    kwLines.push(`BULLETS (prioritize in bullet points): ${keywordAssignments.bullets.join(", ")}`);
  }
  if (keywordAssignments.description.length > 0) {
    kwLines.push(`DESCRIPTION (use in description): ${keywordAssignments.description.join(", ")}`);
  }
  if (keywordAssignments.unassigned.length > 0) {
    kwLines.push(`GENERAL (use naturally anywhere): ${keywordAssignments.unassigned.join(", ")}`);
  }

  parts.push(kwLines.join("\n"));

  // --- 6. Rule base ---
  parts.push(
    `[AMAZON RULE BASE — ENFORCE STRICTLY]\n` +
    `Title: max ${limits.title} characters\n` +
    `Bullets: exactly ${bulletCount} items, max ${limits.bulletItem} characters each\n` +
    `Description: max ${limits.description} characters\n` +
    `Search Terms: max ${limits.searchTerms} characters, space-separated, no repetition from other fields`
  );

  // --- 7. Output task ---
  const bulletsShape = Array.from({ length: bulletCount }, () => `"string"`).join(", ");
  parts.push(
    `[OUTPUT TASK]\n` +
    `Generate a complete, publish-ready Amazon product listing based on all the above.\n` +
    `Use keywords naturally without stuffing. Honor all section assignments.\n` +
    `Return ONLY a valid JSON object, no markdown:\n` +
    `{\n` +
    `  "image_and_context_analysis": "string — step-by-step reasoning: count items, extract text, identify theme/niche, or 'no image provided' if none",\n` +
    `  "title": "string — max ${limits.title} characters",\n` +
    `  "bullets": [${bulletsShape}],\n` +
    `  "description": "string — max ${limits.description} characters",\n` +
    `  "searchTerms": "string — max ${limits.searchTerms} characters"\n` +
    `}\n` +
    `The "bullets" array must have exactly ${bulletCount} items.`
  );

  return parts.join("\n\n---\n\n");
}
