import type { ContentListing } from "./types";

export interface LimitsConfig {
  title: number;
  bulletCount: number;
  bulletItem: number;
  description: number;
  searchTerms: number;
}

/** Input cho buildGeneratePrompt — skill + context người dùng */
export interface PromptLayers {
  /** Limits — title/bullets/description char counts */
  limits: LimitsConfig;
  /** Skill .md content — bao gồm cả base rules (đã merge vào file) */
  skillContent: string;
  /** Context từ user */
  keywords: string;
  /** Chỉ inject khi notes không trống */
  notes?: string;
  /** Chỉ inject khi enableOccasion = true */
  occasion?: string;
}

/**
 * Ghép 2 tầng + context người dùng thành một prompt hoàn chỉnh.
 * Thứ tự: Limits → Skill → Keywords → Occasion → Notes → Task
 */
export function buildGeneratePrompt(layers: PromptLayers): string {
  const { limits, skillContent, keywords, notes, occasion } = layers;
  const parts: string[] = [];

  // --- 1. Image context (nếu có đính kèm) ---
  parts.push(
    `[IMAGE ANALYSIS TASK]\n` +
    `If an image is attached to this prompt, carefully analyze it to extract visual details (materials, colors, target audience, aesthetic, unique features) and incorporate those insights naturally into the product listing.`
  );

  // --- 2. Skill (includes base rules — merged into each .md file) ---
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

  // --- 5. Keywords ---
  parts.push(`[KEYWORDS TO INCORPORATE]\n${keywords.trim()}`);

  // --- 6. Rule Base (Limits) ---
  parts.push(
    `[GENERIC AMAZON RULE BASE — ENFORCE STRICTLY]\n` +
    `Title: max ${limits.title} characters\n` +
    `Bullets: exactly ${limits.bulletCount} items, max ${limits.bulletItem} characters each\n` +
    `Description: max ${limits.description} characters`
  );

  // --- 7. Output Task ---
  parts.push(
    `[OUTPUT TASK]\n` +
    `Generate a complete, publish-ready Amazon product listing based on all the above.\n` +
    `Use the keywords naturally without keyword stuffing.\n` +
    `Return ONLY a valid JSON object, no markdown, no generic explanations:\n` +
    `{\n` +
    `  "image_and_context_analysis": "string — step-by-step reasoning: count items clearly, extract text, identify theme/niche, or 'no image provided' if none",\n` +
    `  "title": "string — max ${limits.title} characters",\n` +
    `  "bullets": ["string", "string", "string", "string", "string"],\n` +
    `  "description": "string — max ${limits.description} characters"\n` +
    `}\n` +
    `The "bullets" array must have exactly ${limits.bulletCount} items.`
  );

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
