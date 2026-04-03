/**
 * Vertex AI Express REST Utility
 *
 * Calls Vertex AI via REST using an API key (no Service Account JSON needed).
 * This is the "Vertex AI Express" mode available at:
 * https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:generateContent?key={apiKey}
 *
 * The API key is created in Google Cloud Console → Vertex AI Studio → API Keys,
 * and is bound to a service account automatically.
 */

const VERTEX_EXPRESS_BASE =
  "https://aiplatform.googleapis.com/v1/publishers/google/models";

export interface VertexPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

export interface VertexContent {
  role: "user" | "model";
  parts: VertexPart[];
}

export interface VertexResponse {
  candidates: Array<{
    content: {
      parts: VertexPart[];
      role: string;
    };
    finishReason?: string;
  }>;
}

/**
 * Makes a generateContent call to Vertex AI Express REST API.
 *
 * @param apiKey - Vertex AI API key from Google Cloud Console
 * @param model  - Model name (e.g. "gemini-2.5-flash-lite", "gemini-2.0-flash-001")
 * @param contents - Conversation contents array
 * @param generationConfig - Optional generation parameters
 * @param systemInstruction - Optional system prompt text
 */
export async function vertexExpressGenerate(
  apiKey: string,
  model: string,
  contents: VertexContent[],
  generationConfig?: Record<string, unknown>,
  systemInstruction?: string
): Promise<VertexResponse> {
  const url = `${VERTEX_EXPRESS_BASE}/${model}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = { contents };
  if (generationConfig) body.generationConfig = generationConfig;
  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Vertex AI Express error ${res.status}: ${errText}`);
  }

  return res.json() as Promise<VertexResponse>;
}
