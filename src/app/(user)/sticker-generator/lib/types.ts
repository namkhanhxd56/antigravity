/**
 * Shared Type Definitions
 *
 * Central type definitions used across the application.
 * All AI service responses and component props should reference these types.
 */

/** A single element extracted from the original uploaded image. */
export interface ExtractedElement {
  id: string;
  imageUrl: string;
  label?: string;
}

// ─── Model Types ─────────────────────────────────────────────────────────────

/** Supported AI model identifiers for sticker generation. */
export type ModelId =
  | "gemini-flash-image"
  | "gemini-2.5-flash-image"
  | "gemini-1.5-flash"
  | "gemini-1.5-flash-002"
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-lite"
  | "gemini-2.0-flash-lite-001"
  | "gemini-2.0-flash-001"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-flash-preview-09-2025"
  | "gemini-3.1-flash-image-preview"
  | "gemini-3-pro-image-preview"
  | "vertex-gemini-flash"
  | "ideogram-2"
  | "dall-e-3"
  | "piapi-flux";

/** Configuration for a single AI model. */
export interface ModelConfig {
  id: ModelId;
  name: string;
  description: string;
  envKey: string;
  strengths: string[];
  available: boolean;
}

// ─── Analysis Types ──────────────────────────────────────────────────────────

/** Represents the AI-generated analysis of a sticker design concept. */
export interface StickerAnalysis {
  /** Target niche or audience for the sticker (e.g., "Funny Firefighter", "Pet Lovers") */
  niche: string;

  /** Description of the target audience */
  targetAudience: string;

  /** Visual style and emotional tone (e.g., "Cyberpunk", "Kawaii", "edgy", "playful") */
  visualStyle: string;

  /** Text or quote to be displayed on the sticker */
  quote: string;

  /** Elements extracted from the original image */
  extractedElements: ExtractedElement[];

  /** Detailed image description prompt for the AI */
  imageDescription: string;

  /** Layout, composition, color and typography description */
  layoutStructure: string;

  /** Optional reference image URL that inspired the design */
  referenceImageUrl?: string;

  /** AI model confidence score for this analysis (0-1) */
  confidence?: number;
}

// ─── Form State ──────────────────────────────────────────────────────────────

/** The form state managed on the sticker-generator page. */
export interface StickerFormState {
  /** Uploaded original image URL (object URL or base64) */
  uploadedImageUrl: string | null;

  /** Niche detected or entered */
  niche: string;

  /** Target audience text */
  targetAudience: string;

  /** Editable quote / extracted text */
  quote: string;

  /** Extracted visual elements from the original */
  extractedElements: ExtractedElement[];

  /** Detailed image description prompt */
  imageDescription: string;

  /** Visual style and emotional tone */
  visualStyle: string;

  /** Layout, composition, color and typography description */
  layoutStructure: string;

  /** Selected AI model for generation ("auto" = AI recommended) */
  selectedModel: ModelId | "auto";

  /** Number of sticker variations to generate (1–4) */
  variations: number;

  /** Canvas background color for generation (optional) */
  canvasColor?: string;
}

// ─── Generation Types ────────────────────────────────────────────────────────

/** A single generated sticker result. */
export interface StickerResult {
  id: string;
  imageUrl: string;
  prompt: string;
  /** Which model generated this result */
  modelId?: ModelId;
}

/** Parameters sent to the AI service for sticker generation. */
export interface StickerGenerationRequest {
  /** The fully composed prompt (form fields + master rules) */
  prompt: string;

  /** Which model to use for generation */
  selectedModel?: string;

  /** Optional uploaded reference image as a base64-encoded string */
  referenceImage?: string;

  /** Number of variations to generate */
  variations: number;

  /** Override specific analysis fields before generation */
  overrides?: Partial<StickerAnalysis>;
}

/** Response from the AI service after sticker generation. */
export interface StickerGenerationResponse {
  /** Whether the generation was successful */
  success: boolean;

  /** Generated sticker images as base64-encoded strings */
  images?: string[];

  /** Which model was used */
  modelId?: ModelId;

  /** AI analysis of the generated design */
  analysis?: StickerAnalysis;

  /** Error message if generation failed */
  error?: string;
}
