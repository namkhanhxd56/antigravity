/**
 * Gemini AI Service
 *
 * Implements the AIProvider interface using Google Gemini API.
 * Uses shared prompts from `./prompts.ts` so switching providers is seamless.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ANALYSIS_SYSTEM_INSTRUCTION,
  ANALYSIS_PROMPT,
  GENERATION_SYSTEM_PROMPT,
} from "./prompts";
import type { AIProvider } from "./provider";
import type {
  StickerAnalysis,
  StickerGenerationRequest,
  StickerGenerationResponse,
} from "@/lib/types";

// ─── Client ──────────────────────────────────────────────────────────────────

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file."
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

// ─── Gemini Provider ─────────────────────────────────────────────────────────

export const geminiProvider: AIProvider = {
  name: "Gemini",

  async analyzeSticker(
    imageBase64: string,
    mimeType: string = "image/png"
  ): Promise<StickerAnalysis> {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent([
      ANALYSIS_PROMPT,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ]);

    const responseText = result.response.text();

    // Strip any accidental markdown code fences
    const cleanedJson = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const analysis: StickerAnalysis = JSON.parse(cleanedJson);

    return {
      niche: analysis.niche || "",
      targetAudience: analysis.targetAudience || "",
      style: analysis.style || "",
      quote: analysis.quote || "",
      extractedElements: [],
      imageDescription: analysis.imageDescription || "",
      layoutDescription: analysis.layoutDescription || "",
    };
  },

  async generateSticker(
    request: StickerGenerationRequest
  ): Promise<StickerGenerationResponse> {
    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-image-preview",
        systemInstruction: GENERATION_SYSTEM_PROMPT,
        generationConfig: {
          // @ts-expect-error — responseModalities supported by API but not yet typed in SDK
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      const images: string[] = [];

      for (let i = 0; i < request.variations; i++) {
        // Build prompt: prioritize text description over reference image
        // The prompt instructs the model to treat the image as LOW-WEIGHT inspiration only
        const textPrompt = [
          request.prompt,
          "",
          "[IMPORTANT] The reference image below is ONLY for thematic inspiration.",
          "DO NOT replicate its layout, composition, or pose.",
          "Create an ENTIRELY NEW design based on the text descriptions above.",
          `This is variation ${i + 1} of ${request.variations} — make each variation visually distinct.`,
        ].join("\n");

        const parts: (string | { inlineData: { mimeType: string; data: string } })[] = [
          textPrompt,
        ];

        // Attach reference image as LOW-WEIGHT inspiration only
        if (request.referenceImage) {
          parts.push({
            inlineData: {
              mimeType: "image/png",
              data: request.referenceImage,
            },
          });
        }

        const result = await model.generateContent(parts);
        const response = result.response;

        // Extract inline image data from the response
        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
          const responseParts = candidates[0].content?.parts;
          if (responseParts) {
            for (const part of responseParts) {
              if (part.inlineData?.data) {
                images.push(
                  `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`
                );
              }
            }
          }
        }
      }

      if (images.length === 0) {
        return {
          success: false,
          modelId: "gemini-flash-image",
          error: "Gemini did not return any images. Try adjusting your prompt or reducing variations.",
        };
      }

      return {
        success: true,
        modelId: "gemini-flash-image",
        images,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown generation error";
      return {
        success: false,
        modelId: "gemini-flash-image",
        error: message,
      };
    }
  },
};

// ─── Legacy exports (backward compatible with existing API route) ────────────

export const analyzeSticker = geminiProvider.analyzeSticker.bind(geminiProvider);
export const generateSticker = geminiProvider.generateSticker.bind(geminiProvider);
