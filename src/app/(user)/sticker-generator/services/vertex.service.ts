/**
 * Vertex AI Service
 *
 * Implements the AIProvider interface using Google Cloud Vertex AI.
 * Uses Service Account JSON for authentication.
 */

import {
  VertexAI,
  type GenerativeModel,
  type GenerationConfig,
} from "@google-cloud/vertexai";
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

// ─── Client Helper ───────────────────────────────────────────────────────────

function getVertexClient(jsonString: string) {
  try {
    const credentials = JSON.parse(jsonString);
    const project = credentials.project_id;
    if (!project) throw new Error("project_id missing in Service Account JSON");

    // Default to us-central1 if not specified (Vertex AI requirement)
    const location = "us-central1";

    const vertexAI = new VertexAI({
      project,
      location,
      googleAuthOptions: { credentials },
    });

    return vertexAI;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Invalid JSON";
    throw new Error(`Failed to initialize Vertex AI: ${msg}`);
  }
}

// ─── Vertex Provider ─────────────────────────────────────────────────────────

export const vertexProvider: AIProvider = {
  name: "Vertex AI",

  async analyzeSticker(
    imageBase64: string,
    mimeType: string = "image/png",
    apiKey?: string,
    modelId?: string
  ): Promise<StickerAnalysis> {
    const vertexAI = getVertexClient(apiKey!);
    const model = vertexAI.getGenerativeModel({
      model: modelId || "gemini-1.5-flash-002",
      systemInstruction: {
        role: "system",
        parts: [{ text: ANALYSIS_SYSTEM_INSTRUCTION }],
      },
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: ANALYSIS_PROMPT },
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
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
    const vertexAI = getVertexClient(apiKey!);
    const model = vertexAI.getGenerativeModel({
      model: modelId || "gemini-1.5-flash-002",
      systemInstruction: {
        role: "system",
        parts: [{ text: REFINE_ANALYSIS_PROMPT }],
      },
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    try {
      const promptText = `CURRENT STATE:\n${JSON.stringify(currentState, null, 2)}\n\nUSER MODIFICATIONS:\n${modifications}`;
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
      });
      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleanedJson = responseText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      const analysis: StickerAnalysis = JSON.parse(cleanedJson);
      return {
        ...analysis,
        extractedElements: currentState.extractedElements || [],
      };
    } catch (error) {
      console.error("Vertex refine analysis error:", error);
      throw new Error("Failed to refine structure via Vertex AI.");
    }
  },

  async generateSticker(
    request: StickerGenerationRequest,
    apiKey?: string
  ): Promise<StickerGenerationResponse> {
    try {
      const vertexAI = getVertexClient(apiKey!);
      const selectedModelId = request.selectedModel || "gemini-1.5-flash-002";

      const model = vertexAI.getGenerativeModel({
        model: selectedModelId, 
        systemInstruction: {
          role: "system",
          parts: [{ text: GENERATION_SYSTEM_PROMPT }],
        },
        generationConfig: {
          // @ts-expect-error — responseModalities supported by API but not yet typed in SDK
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      const images: string[] = [];
      const generatePromises = Array.from(
        { length: request.variations },
        async (_, i) => {
          const textPrompt = [
            request.prompt,
            "",
            "[IMPORTANT] The reference image below is ONLY for thematic inspiration.",
            "DO NOT replicate its layout, composition, or pose.",
            "Create an ENTIRELY NEW design based on the text descriptions.",
            `Variation ${i + 1} of ${request.variations}`,
          ].join("\n");

          const parts: any[] = [{ text: textPrompt }];
          if (request.referenceImage) {
            parts.push({
              inlineData: {
                mimeType: "image/png",
                data: request.referenceImage,
              },
            });
          }

          const result = await model.generateContent({
            contents: [{ role: "user", parts }],
          });
          const response = result.response;
          const candidateParts = response.candidates?.[0]?.content?.parts;

          if (candidateParts) {
            for (const part of candidateParts) {
              if (part.inlineData?.data) {
                return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
              }
            }
          }
          throw new Error("No image in Vertex response part");
        }
      );

      const results = await Promise.allSettled(generatePromises);
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) images.push(result.value);
      }

      if (images.length === 0) {
        return { success: false, modelId: selectedModelId as any, error: "No images generated via Vertex" };
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
