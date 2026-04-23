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
  REFINE_ANALYSIS_PROMPT,
} from "./prompts";
import type { AIProvider } from "./provider";
import type {
  StickerAnalysis,
  StickerGenerationRequest,
  StickerGenerationResponse,
} from "../lib/types";

// ─── Client ──────────────────────────────────────────────────────────────────

function getGeminiClient(clientKey?: string) {
  const apiKey = clientKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not set. Please add it to your Settings or .env.local file."
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

// ─── Gemini Provider ─────────────────────────────────────────────────────────

export const geminiProvider: AIProvider = {
  name: "Gemini",

  async analyzeSticker(
    imageBase64: string,
    mimeType: string = "image/png",
    apiKey?: string,
    modelId?: string
  ): Promise<StickerAnalysis> {
    const genAI = getGeminiClient(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelId || "gemini-1.5-flash",
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
      niche: analysis.niche ?? "",
      targetAudience: analysis.targetAudience ?? "",
      visualStyle: analysis.visualStyle ?? "",
      quote: analysis.quote ?? "",
      extractedElements: [],
      imageDescription: analysis.imageDescription ?? "",
      layoutStructure: analysis.layoutStructure ?? "",
    };
  },

  async refineAnalysis(
    currentState: StickerAnalysis,
    modifications: string,
    apiKey?: string,
    modelId?: string
  ): Promise<StickerAnalysis> {
    const genAI = getGeminiClient(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelId || "gemini-1.5-flash",
      systemInstruction: REFINE_ANALYSIS_PROMPT,
      generationConfig: {
        temperature: 0.1, // low temp for precision
        responseMimeType: "application/json",
      },
    });

    try {
      const prompt = `CURRENT STATE:\n${JSON.stringify(currentState, null, 2)}\n\nUSER MODIFICATIONS:\n${modifications}`;
      
      const result = await model.generateContent([prompt]);
      const textResponse = result.response.text();

      // Ensure clean JSON string
      const cleanJson = textResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const analysis: StickerAnalysis = JSON.parse(cleanJson);
      
      return {
        niche: analysis.niche ?? "",
        targetAudience: analysis.targetAudience ?? "",
        visualStyle: analysis.visualStyle ?? "",
        quote: analysis.quote ?? "",
        extractedElements: currentState.extractedElements || [],
        imageDescription: analysis.imageDescription ?? "",
        layoutStructure: analysis.layoutStructure ?? "",
      };
    } catch (error) {
      console.error("Gemini refine analysis error:", error);
      throw new Error("Failed to refine analysis or invalid JSON returned.");
    }
  },

  async generateSticker(
    request: StickerGenerationRequest,
    apiKey?: string
  ): Promise<StickerGenerationResponse> {
    try {
      const genAI = getGeminiClient(apiKey);
      const selectedModelId = request.selectedModel || "gemini-1.5-flash";
      
      const model = genAI.getGenerativeModel({
        model: selectedModelId, 
        systemInstruction: GENERATION_SYSTEM_PROMPT,
        generationConfig: {
          // @ts-expect-error — responseModalities supported by API but not yet typed in SDK
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      const images: string[] = [];

      // Create an array of generation promises to run concurrently
      const generatePromises = Array.from(
        { length: request.variations },
        async (_, i) => {
          // Detect whether this is an edit/refine request (prompt starts with [INSTRUCTION])
          const isEditRequest = request.prompt.includes("[INSTRUCTION]");

          let textPrompt: string;
          if (isEditRequest && request.referenceImage) {
            // Edit mode: read the image + apply the user's modification
            textPrompt = [
              request.prompt,
              "",
              "[IMPORTANT] You MUST look at the attached reference image carefully.",
              "Apply the requested modifications to this image while preserving its overall style and identity.",
              "Output a single modified sticker image.",
            ].join("\n");
          } else {
            // New generation mode
            textPrompt = [
              request.prompt,
              "",
              request.referenceImage
                ? "[IMPORTANT] The reference image below is ONLY for thematic inspiration."
                : "",
              request.referenceImage
                ? "DO NOT replicate its layout, composition, or pose."
                : "",
              "Create an ENTIRELY NEW design based on the text descriptions above.",
              `This is variation ${i + 1} of ${request.variations} — make each variation visually distinct.`,
            ].filter(Boolean).join("\n");
          }

          const parts: (
            | string
            | { inlineData: { mimeType: string; data: string } }
          )[] = [textPrompt];

          // Attach reference image if available
          if (request.referenceImage) {
            const imgData = request.referenceImage.startsWith("data:")
              ? request.referenceImage.split(",")[1]
              : request.referenceImage;
            parts.push({
              inlineData: {
                mimeType: "image/png",
                data: imgData,
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
                  return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
                }
              }
            }
          }
          throw new Error("No image data found in candidate response");
        }
      );

      // Execute all promises concurrently and filter out any that failed
      const results = await Promise.allSettled(generatePromises);

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          images.push(result.value);
        } else if (result.status === "rejected") {
          console.error("A generation variation failed:", result.reason);
        }
      }

      if (images.length === 0) {
        return {
          success: false,
          modelId: selectedModelId as any,
          error: "Gemini did not return any images. Try adjusting your prompt or reducing variations.",
        };
      }

      return {
        success: true,
        modelId: selectedModelId as any,
        images,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown generation error";
      return {
        success: false,
        modelId: (request.selectedModel as any) || "gemini-1.5-flash",
        error: message,
      };
    }
  },
};

// ─── Legacy exports (backward compatible with existing API route) ────────────

export const analyzeSticker = geminiProvider.analyzeSticker.bind(geminiProvider);
export const generateSticker = geminiProvider.generateSticker.bind(geminiProvider);
