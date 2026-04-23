/**
 * Vertex AI Express Service (API Key)
 *
 * Implements AIProvider using Vertex AI Express REST API with an API key.
 * No Service Account JSON required — uses the key from Vertex AI Studio.
 *
 * Endpoint: https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:generateContent?key={apiKey}
 */

import {
  ANALYSIS_SYSTEM_INSTRUCTION,
  ANALYSIS_PROMPT,
  GENERATION_SYSTEM_PROMPT,
  REFINE_ANALYSIS_PROMPT,
} from "./prompts";
import { vertexExpressGenerate } from "@/lib/vertex-express";
import type { AIProvider } from "./provider";
import type {
  StickerAnalysis,
  StickerGenerationRequest,
  StickerGenerationResponse,
} from "../lib/types";

// ─── Vertex AI Provider (API Key) ────────────────────────────────────────────

export const vertexApiKeyProvider: AIProvider = {
  name: "Vertex AI (API Key)",

  async analyzeSticker(
    imageBase64: string,
    mimeType: string = "image/png",
    apiKey?: string,
    modelId?: string
  ): Promise<StickerAnalysis> {
    if (!apiKey) throw new Error("Vertex AI API key is required");

    const model = modelId || "gemini-2.0-flash-001";
    const response = await vertexExpressGenerate(
      apiKey,
      model,
      [
        {
          role: "user",
          parts: [
            { text: ANALYSIS_PROMPT },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
      undefined,
      ANALYSIS_SYSTEM_INSTRUCTION
    );

    const responseText =
      response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleanedJson = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    return JSON.parse(cleanedJson);
  },

  async refineAnalysis(
    currentState: StickerAnalysis,
    modifications: string,
    apiKey?: string,
    modelId?: string
  ): Promise<StickerAnalysis> {
    if (!apiKey) throw new Error("Vertex AI API key is required");

    const model = modelId || "gemini-2.0-flash-001";
    const promptText = `CURRENT STATE:\n${JSON.stringify(currentState, null, 2)}\n\nUSER MODIFICATIONS:\n${modifications}`;

    const response = await vertexExpressGenerate(
      apiKey,
      model,
      [{ role: "user", parts: [{ text: promptText }] }],
      { temperature: 0.1, responseMimeType: "application/json" },
      REFINE_ANALYSIS_PROMPT
    );

    const responseText =
      response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleanedJson = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const analysis: StickerAnalysis = JSON.parse(cleanedJson);
    return {
      ...analysis,
      extractedElements: currentState.extractedElements || [],
    };
  },

  async generateSticker(
    request: StickerGenerationRequest,
    apiKey?: string
  ): Promise<StickerGenerationResponse> {
    if (!apiKey) {
      return { success: false, error: "Vertex AI API key is required" };
    }

    try {
      const selectedModelId = request.selectedModel || "gemini-3.1-flash-image-preview";
      const images: string[] = [];

      const generatePromises = Array.from(
        { length: request.variations },
        async (_, i) => {
          const isEditRequest = request.prompt.includes("[INSTRUCTION]");

          let textPrompt: string;
          if (isEditRequest && request.referenceImage) {
            textPrompt = [
              request.prompt,
              "",
              "[IMPORTANT] You MUST look at the attached reference image carefully.",
              "Apply the requested modifications to this image while preserving its overall style and identity.",
              "Output a single modified sticker image.",
            ].join("\n");
          } else {
            textPrompt = [
              request.prompt,
              "",
              request.referenceImage
                ? "[IMPORTANT] The reference image below is ONLY for thematic inspiration."
                : "",
              request.referenceImage
                ? "DO NOT replicate its layout, composition, or pose."
                : "",
              "Create an ENTIRELY NEW design based on the text descriptions.",
              `Variation ${i + 1} of ${request.variations}`,
            ].filter(Boolean).join("\n");
          }

          const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
            { text: textPrompt },
          ];
          if (request.referenceImage) {
            const imgData = request.referenceImage.startsWith("data:")
              ? request.referenceImage.split(",")[1]
              : request.referenceImage;
            parts.push({
              inlineData: { mimeType: "image/png", data: imgData },
            });
          }

          const response = await vertexExpressGenerate(
            apiKey,
            selectedModelId,
            [{ role: "user", parts }],
            { responseModalities: ["TEXT", "IMAGE"] } as Record<string, unknown>,
            GENERATION_SYSTEM_PROMPT
          );

          const candidateParts = response.candidates?.[0]?.content?.parts;
          if (candidateParts) {
            for (const part of candidateParts) {
              if (part.inlineData?.data) {
                return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
              }
            }
          }
          throw new Error("No image in Vertex Express response");
        }
      );

      const results = await Promise.allSettled(generatePromises);
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          images.push(result.value);
        }
      }

      if (images.length === 0) {
        return {
          success: false,
          modelId: selectedModelId as any,
          error: "No images generated via Vertex AI Express",
        };
      }

      return { success: true, modelId: selectedModelId as any, images };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};
