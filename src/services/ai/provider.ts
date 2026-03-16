/**
 * AI Provider Interface
 *
 * Abstract interface for AI service providers.
 * Any provider (Gemini, OpenAI, Anthropic, etc.) must implement this interface
 * so the application can switch between providers seamlessly.
 *
 * All providers share the same prompts from `./prompts.ts`.
 */

import type {
  StickerAnalysis,
  StickerGenerationRequest,
  StickerGenerationResponse,
} from "@/lib/types";

export interface AIProvider {
  /** Human-readable name of the provider (e.g., "Gemini", "OpenAI") */
  readonly name: string;

  /**
   * Analyzes a sticker image and returns structured analysis data.
   *
   * @param imageBase64 - The image as a base64-encoded string (no data URL prefix)
   * @param mimeType - The MIME type (e.g., "image/png", "image/jpeg")
   * @returns Parsed StickerAnalysis object
   */
  analyzeSticker(
    imageBase64: string,
    mimeType?: string,
    apiKey?: string
  ): Promise<StickerAnalysis>;

  /**
   * Generates a sticker design based on the given prompt and parameters.
   *
   * @param request - The generation parameters including prompt and variations
   * @returns The generated sticker image(s) and metadata
   */
  generateSticker(
    request: StickerGenerationRequest,
    apiKey?: string
  ): Promise<StickerGenerationResponse>;
}
