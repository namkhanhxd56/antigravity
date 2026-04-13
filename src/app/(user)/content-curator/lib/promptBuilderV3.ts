/**
 * promptBuilderV3 — per-section prompt builders cho sequential pipeline.
 *
 * Mỗi function nhận đúng context cần thiết cho section của nó.
 * Không có base rules chung — tất cả rules nằm trong skill file.
 */

import type { ContentLimits } from "./useContentLimits";

export interface ImageAnalysis {
  sticker_count?: number;
  niche?: string;
  theme?: string;
  text_on_stickers?: string[];
  surfaces?: string[];
  raw?: string; // raw text nếu AI không trả về JSON
}

function formatImageAnalysis(analysis: ImageAnalysis | null): string {
  if (!analysis) return "";
  if (analysis.raw) return analysis.raw;
  const parts: string[] = [];
  if (analysis.sticker_count !== undefined) parts.push(`Count: ${analysis.sticker_count}`);
  if (analysis.niche) parts.push(`Niche: ${analysis.niche}`);
  if (analysis.theme) parts.push(`Theme: ${analysis.theme}`);
  if (analysis.text_on_stickers?.length) parts.push(`Text on product: ${analysis.text_on_stickers.join(", ")}`);
  if (analysis.surfaces?.length) parts.push(`Surfaces/use cases: ${analysis.surfaces.join(", ")}`);
  return parts.join("\n");
}

// ─── Step 0: Image Analysis ───────────────────────────────────────────────────

const DEFAULT_IMAGE_PROMPT =
  `Analyze this product image carefully.\n` +
  `Return ONLY a valid JSON object, no markdown:\n` +
  `{\n` +
  `  "sticker_count": <number of distinct sticker/item designs visible>,\n` +
  `  "niche": "<product niche, e.g. 'funny cat stickers'>",\n` +
  `  "theme": "<overall theme or style>",\n` +
  `  "text_on_stickers": ["<text visible on each sticker if any>"],\n` +
  `  "surfaces": ["<suitable surfaces or use cases, e.g. laptop, water bottle>"]` +
  `\n}`;

export function buildImageAnalysisPrompt(skillImage?: string): string {
  if (skillImage?.trim()) {
    return skillImage.trim();
  }
  return DEFAULT_IMAGE_PROMPT;
}

// ─── Step 1: Title ────────────────────────────────────────────────────────────

export interface TitlePromptInput {
  skillTitle: string;
  imageAnalysis: ImageAnalysis | null;
  assignedKeywords: string[];
  availablePool: string[];
  limits: ContentLimits;
  notes?: string;
  occasion?: string;
}

export function buildTitlePrompt(input: TitlePromptInput): string {
  const { skillTitle, imageAnalysis, assignedKeywords, availablePool, limits, notes, occasion } = input;
  const parts: string[] = [];

  if (skillTitle.trim()) {
    parts.push(`[SKILL — TITLE WRITING RULES]\n${skillTitle.trim()}`);
  }

  const imgText = formatImageAnalysis(imageAnalysis);
  if (imgText) {
    parts.push(`[IMAGE ANALYSIS]\n${imgText}`);
  }

  if (notes?.trim()) {
    parts.push(`[SELLER NOTES]\n${notes.trim()}`);
  }

  if (occasion?.trim()) {
    parts.push(`[CAMPAIGN CONTEXT]\nOptimize for: ${occasion}. Adjust tone and angle accordingly.`);
  }

  const kwLines: string[] = ["[KEYWORDS FOR TITLE]"];
  if (assignedKeywords.length > 0) {
    kwLines.push(`MUST USE (assigned to title): ${assignedKeywords.join(", ")}`);
  }
  const extra = availablePool.slice(0, 10);
  if (extra.length > 0) {
    kwLines.push(`ADDITIONAL (use if space allows): ${extra.join(", ")}`);
  }
  parts.push(kwLines.join("\n"));

  parts.push(
    `[RULES]\n` +
    `- Max ${limits.title} characters total\n` +
    `- No ®©™ symbols\n` +
    `- Use assigned keywords naturally — do not keyword-stuff\n` +
    `- Return ONLY the title string, no quotes, no markdown`
  );

  return parts.join("\n\n---\n\n");
}

// ─── Step 2: Bullets ──────────────────────────────────────────────────────────

export interface BulletsPromptInput {
  skillBullets: string;
  imageAnalysis: ImageAnalysis | null;
  titleText: string;
  assignedKeywords: string[];
  availablePool: string[];
  bulletCount: number;
  limits: ContentLimits;
  notes?: string;
  occasion?: string;
}

export function buildBulletsPrompt(input: BulletsPromptInput): string {
  const { skillBullets, imageAnalysis, titleText, assignedKeywords, availablePool, bulletCount, limits, notes, occasion } = input;
  const parts: string[] = [];

  if (skillBullets.trim()) {
    parts.push(`[SKILL — BULLET WRITING RULES]\n${skillBullets.trim()}`);
  }

  const imgText = formatImageAnalysis(imageAnalysis);
  if (imgText) {
    parts.push(`[IMAGE ANALYSIS]\n${imgText}`);
  }

  if (titleText.trim()) {
    parts.push(`[ALREADY WRITTEN — DO NOT REPEAT]\nTitle: ${titleText.trim()}`);
  }

  if (notes?.trim()) {
    parts.push(`[SELLER NOTES]\n${notes.trim()}`);
  }

  if (occasion?.trim()) {
    parts.push(`[CAMPAIGN CONTEXT]\nOptimize for: ${occasion}.`);
  }

  const kwLines: string[] = ["[KEYWORDS FOR BULLETS]"];
  if (assignedKeywords.length > 0) {
    kwLines.push(`MUST USE (assigned to bullets): ${assignedKeywords.join(", ")}`);
  }
  const extra = availablePool.slice(0, 12);
  if (extra.length > 0) {
    kwLines.push(`ADDITIONAL (use naturally if relevant): ${extra.join(", ")}`);
  }
  parts.push(kwLines.join("\n"));

  const shape = Array.from({ length: bulletCount }, () => `"string"`).join(", ");
  parts.push(
    `[RULES]\n` +
    `- Write exactly ${bulletCount} bullet points\n` +
    `- Max ${limits.bulletItem} characters per bullet\n` +
    `- Each bullet highlights a distinct benefit or feature\n` +
    `- Do not repeat keywords already used in the title\n` +
    `- Return ONLY a valid JSON array: [${shape}]`
  );

  return parts.join("\n\n---\n\n");
}

// ─── Step 3: Description ──────────────────────────────────────────────────────

export interface DescriptionPromptInput {
  skillDescription: string;
  imageAnalysis: ImageAnalysis | null;
  titleText: string;
  bulletsText: string[];
  assignedKeywords: string[];
  availablePool: string[];
  limits: ContentLimits;
  notes?: string;
  occasion?: string;
}

export function buildDescriptionPrompt(input: DescriptionPromptInput): string {
  const { skillDescription, imageAnalysis, titleText, bulletsText, assignedKeywords, availablePool, limits, notes, occasion } = input;
  const parts: string[] = [];

  if (skillDescription.trim()) {
    parts.push(`[SKILL — DESCRIPTION WRITING RULES]\n${skillDescription.trim()}`);
  }

  const imgText = formatImageAnalysis(imageAnalysis);
  if (imgText) {
    parts.push(`[IMAGE ANALYSIS]\n${imgText}`);
  }

  const contextParts: string[] = ["[ALREADY WRITTEN — COMPLEMENT, DO NOT REPEAT]"];
  if (titleText.trim()) contextParts.push(`Title: ${titleText.trim()}`);
  if (bulletsText.length > 0) contextParts.push(`Bullets:\n${bulletsText.map((b, i) => `${i + 1}. ${b}`).join("\n")}`);
  if (contextParts.length > 1) parts.push(contextParts.join("\n"));

  if (notes?.trim()) {
    parts.push(`[SELLER NOTES]\n${notes.trim()}`);
  }

  if (occasion?.trim()) {
    parts.push(`[CAMPAIGN CONTEXT]\nOptimize for: ${occasion}.`);
  }

  const kwLines: string[] = ["[KEYWORDS FOR DESCRIPTION]"];
  if (assignedKeywords.length > 0) {
    kwLines.push(`MUST USE (assigned to description): ${assignedKeywords.join(", ")}`);
  }
  const extra = availablePool.slice(0, 10);
  if (extra.length > 0) {
    kwLines.push(`ADDITIONAL (use naturally): ${extra.join(", ")}`);
  }
  parts.push(kwLines.join("\n"));

  parts.push(
    `[RULES]\n` +
    `- Max ${limits.description} characters\n` +
    `- Complement title and bullets — add new angles, don't repeat them\n` +
    `- Use assigned keywords naturally\n` +
    `- Return ONLY the description string, no quotes, no markdown`
  );

  return parts.join("\n\n---\n\n");
}
