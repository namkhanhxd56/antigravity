/** A complete Amazon product listing */
export interface ContentListing {
  title: string;
  bullets: string[];
  description: string;
  searchTerms?: string;
}

/** Request body for the per-section rewrite API */
export interface RewriteRequest {
  section: "title" | "bullet" | "description";
  /** For bullet rewrites: which bullet (0-indexed) */
  bulletIndex?: number;
  /** Current text content of the section */
  currentContent: string;
  /** User's natural-language instruction */
  instruction: string;
  /** Gemini model ID */
  model?: string;
  /**
   * Character limit for this section — passed from client's useContentLimits.
   * Server falls back to limits.json if not provided.
   */
  charLimit?: number;
}

/** Response from the rewrite API */
export interface RewriteResponse {
  success: boolean;
  rewritten?: string;
  error?: string;
}

/** Skill profile option shape (used for both static defaults and dynamic list) */
export interface SkillOption {
  value: string;
  label: string;
}

/** Default skill profiles — fallback if API is unavailable */
export const DEFAULT_SKILL_OPTIONS: SkillOption[] = [
  { value: "Editorial_Pro_V2.md", label: "Editorial Pro V2" },
  { value: "Luxury_Brand.md", label: "Luxury Brand" },
  { value: "Budget_Friendly.md", label: "Budget Friendly" },
];

/** Default Gemini model — used when user has not chosen a model in Settings yet */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/** Occasion options for campaign-specific listing */
export const OCCASIONS = [
  "Everyday",
  "Holiday Q4",
  "Prime Day",
  "Back to school",
  "Valentine's",
] as const;

export type Occasion = (typeof OCCASIONS)[number];

// ─── V3 Pipeline Types ────────────────────────────────────────────────────────

/** Kết quả phân tích ảnh sản phẩm (Step 0) */
export interface ImageAnalysis {
  sticker_count?: number;
  niche?: string;
  theme?: string;
  text_on_stickers?: string[];
  surfaces?: string[];
  /** Raw text nếu AI không trả về JSON đúng format */
  raw?: string;
}

/**
 * Trạng thái hiện tại của pipeline sequential.
 * null = không đang generate.
 */
export type PipelineStage = "image" | "title" | "bullets" | "description" | null;

/**
 * Phiên bản pipeline.
 * v1 = tuần tự (sequential): image → title → bullets → description, có context chéo.
 * v2 = (sẽ implement sau).
 */
export type PipelineVersion = "v1" | "v2";

/** Keyword assignments từ KeywordAssigner component */
export interface KeywordAssignments {
  title: string[];
  bullets: string[];
  description: string[];
}
