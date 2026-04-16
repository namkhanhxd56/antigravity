/**
 * aiCall — shared multi-provider AI call helper.
 * Dùng cho tất cả 4 API routes của sequential pipeline.
 * Tách logic provider ra khỏi từng route để tránh lặp code.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { VertexAI } from "@google-cloud/vertexai";
import { vertexExpressGenerate } from "@/lib/vertex-express";

export interface AiCallHeaders {
  vertexJson: string | null;
  vertexApiKey: string | null;
  apiKey: string | null;
}

export interface AiCallOptions {
  prompt: string;
  /** Base64 data URL (e.g. "data:image/png;base64,...") — optional */
  image?: string | null;
  model?: string | null;
  headers: AiCallHeaders;
  /** "json" — dùng responseMimeType: application/json. Default: "text" */
  responseType?: "text" | "json";
  /** Temperature (default 0.75) */
  temperature?: number;
}

function extractImageParts(image: string): { mimeType: string; data: string } | null {
  const match = image.match(/^data:(image\/[a-zA-Z0-9]+);base64,/);
  if (!match) return null;
  return {
    mimeType: match[1],
    data: image.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, ""),
  };
}

export async function callAI(opts: AiCallOptions): Promise<string> {
  const { prompt, image, model, headers, responseType = "text", temperature = 0.75 } = opts;
  const { vertexJson, vertexApiKey, apiKey } = headers;

  if (!apiKey && !vertexJson && !vertexApiKey) {
    throw new Error("No API credentials. Configure API key in Settings.");
  }

  const mimeType = responseType === "json" ? "application/json" : "text/plain";
  const imgParts = image ? extractImageParts(image) : null;

  // ─── Vertex AI (Service Account JSON) ────────────────────────────────────
  if (vertexJson) {
    try {
      const credentials = JSON.parse(vertexJson);
      const project = credentials.project_id;
      const vertexAI = new VertexAI({ project, location: "us-central1", googleAuthOptions: { credentials } });
      const vModel = vertexAI.getGenerativeModel({
        model: model || "gemini-2.0-flash",
        generationConfig: { responseMimeType: mimeType as any, temperature },
      });
      const vParts: any[] = [{ text: prompt }];
      if (imgParts) vParts.unshift({ inlineData: imgParts });
      const result = await vModel.generateContent({ contents: [{ role: "user", parts: vParts }] });
      return result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (e) {
      throw new Error(`Vertex AI failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  // ─── Vertex AI Express (API Key) ──────────────────────────────────────────
  if (vertexApiKey) {
    try {
      const vParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: prompt }];
      if (imgParts) vParts.unshift({ inlineData: imgParts });
      const res = await vertexExpressGenerate(
        vertexApiKey,
        model || "gemini-2.0-flash",
        [{ role: "user", parts: vParts }],
        { responseMimeType: mimeType, temperature }
      );
      return res.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (e) {
      throw new Error(`Vertex AI Express failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  // ─── Gemini AI Studio ─────────────────────────────────────────────────────
  const genAI = new GoogleGenerativeAI(apiKey!);
  const geminiModel = genAI.getGenerativeModel({
    model: model || "gemini-2.0-flash",
    generationConfig: { responseMimeType: mimeType as any, temperature },
  });
  const aParts: any[] = [{ text: prompt }];
  if (imgParts) aParts.unshift({ inlineData: imgParts });
  const result = await geminiModel.generateContent(aParts);
  return result.response.text();
}

/** Resolve credentials từ request headers + env vars */
export function resolveAiHeaders(request: Request): AiCallHeaders {
  const req = request as any; // NextRequest compatible
  const get = (key: string): string | null => req.headers?.get?.(key) ?? null;

  return {
    vertexJson: get("x-curator-vertex-json") || process.env.CURATOR_VERTEX_AI_JSON || process.env.VERTEX_AI_JSON || null,
    vertexApiKey: get("x-curator-vertex-key") || process.env.CURATOR_VERTEX_API_KEY || null,
    apiKey: get("x-gemini-api-key") || process.env.CURATOR_GEMINI_API_KEY || process.env.GEMINI_API_KEY || null,
  };
}
