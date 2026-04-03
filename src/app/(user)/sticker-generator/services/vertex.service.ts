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
    apiKey?: string // Reusing apiKey param to pass JSON string if provided from UI
  ): Promise<StickerAnalysis> {
    const vertexAI = getVertexClient(apiKey!);
    const model = vertexAI.getGenerativeModel({
      model: "gemini-1.5-flash",
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

    const response = await result.response;
    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
    apiKey?: string
  ): Promise<StickerAnalysis> {
    const vertexAI = getVertexClient(apiKey!);
    const model = vertexAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: {
        role: "system",
        parts: [{ text: REFINE_ANALYSIS_PROMPT }],
      },
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const prompt = `CURRENT STATE:\n${JSON.stringify(currentState, null, 2)}\n\nUSER MODIFICATIONS:\n${modifications}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    
    const response = await result.response;
    const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
  },

  async generateSticker(
    request: StickerGenerationRequest,
    apiKey?: string
  ): Promise<StickerGenerationResponse> {
    try {
      const vertexAI = getVertexClient(apiKey!);
      const model = vertexAI.getGenerativeModel({
        model: "gemini-1.5-flash", // Note: standard flash supports multimodal
        systemInstruction: {
          role: "system",
          parts: [{ text: GENERATION_SYSTEM_PROMPT }],
        },
        generationConfig: {
          // @ts-ignore - responseModalities is supported but might not be in types yet
          responseModalities: ["TEXT", "IMAGE"],
        } as GenerationConfig,
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
            "Create an ENTIRELY NEW design based on the text descriptions above.",
            `Variation ${i + 1} of ${request.variations}.`,
          ].join("\n");

          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: textPrompt }] }],
          });

          const response = await result.response;
          const candidates = response.candidates;
          
          if (candidates?.[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
              if (part.inlineData?.data) {
                return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
              }
            }
          }
          throw new Error("No image in Vertex AI response");
        }
      );

      const results = await Promise.allSettled(generatePromises);

      for (const res of results) {
        if (res.status === "fulfilled" && res.value) {
          images.push(res.value);
        }
      }

      if (images.length === 0) throw new Error("Vertex AI generation failed.");

      return {
        success: true,
        modelId: "vertex-gemini-flash",
        images,
      };
    } catch (error) {
      return {
        success: false,
        modelId: "vertex-gemini-flash",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};
