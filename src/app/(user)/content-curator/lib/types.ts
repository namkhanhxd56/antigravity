/** A complete Amazon product listing */
export interface ContentListing {
  title: string;
  bullets: string[];
  description: string;
  searchTerms?: string;
}

/** Input payload sent to the generate API */
export interface GenerateRequest {
  keywords: string;
  skillName: string;
  /** Gemini model ID — reads from localStorage via getStoredModel() */
  model?: string;
  /** Only sent when notes field is non-empty */
  notes?: string;
  /** Only sent when "Enable Occasion" checkbox is checked */
  occasion?: string;
  /** Base64 product image */
  image?: string;
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
  context: {
    skillName: string;
    keywords: string;
    otherSections?: {
      title?: string;
      description?: string;
    };
  };
}

/** Response from the rewrite API */
export interface RewriteResponse {
  success: boolean;
  rewritten?: string;
  error?: string;
}

/** Debug data trả về cùng generate/rewrite response */
export interface DebugData {
  /** Prompt hoàn chỉnh đã gửi cho AI (từ preview-prompt API) */
  prompt?: string;
  /** Raw text AI trả về trước khi parse */
  rawResponse?: string;
  /** Metadata về skill + prompt size */
  meta?: {
    skillName: string;
    skillCharCount: number;
    baseRulesCharCount: number;
    totalPromptChars: number;
    duplicateWarnings: string[];
  };
}

/** Response from the generate API */
export interface GenerateResponse {
  success: boolean;
  listing?: ContentListing;
  error?: string;
  _debug?: { rawResponse: string };
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

/** Occasion options for campaign-specific listing */
export const OCCASIONS = [
  "Everyday",
  "Holiday Q4",
  "Prime Day",
  "Back to school",
  "Valentine's",
] as const;

export type Occasion = (typeof OCCASIONS)[number];

/** Amazon content character limits */
export const CONTENT_LIMITS = {
  title: 200,
  bulletItem: 250,
  bulletMax: 10,
  bulletMin: 5,
  description: 1000,
  searchTerms: 250,
} as const;
