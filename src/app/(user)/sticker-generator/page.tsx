"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import TopNav from "@/components/shared/TopNav";
import SourceSidebar from "./components/SourceSidebar";
import AnalyticsPanel from "./components/AnalyticsPanel";
import ResultGrid from "./components/ResultGrid";
import { STICKER_MASTER_RULES } from "./lib/rules";
import { fileToBase64 } from "@/lib/utils";
import { getStoredApiKey } from "@/lib/client-key-storage";
import type {
  StickerFormState,
  StickerResult,
  StickerAnalysis,
  ModelConfig,
  ModelId,
} from "./lib/types";

/** Default form state values. */
const DEFAULT_FORM_STATE: StickerFormState = {
  uploadedImageUrl: null,
  niche: "",
  targetAudience: "",
  quote: "",
  extractedElements: [],
  imageDescription: "",
  visualStyle: "",
  layoutStructure: "",
  selectedModel: "auto",
  variations: 2,
};

/**
 * Builds the final generation prompt by combining all user-editable fields
 * from the AnalyticsPanel with STICKER_MASTER_RULES.
 */
function buildGenerationPrompt(state: StickerFormState): string {
  const sections: string[] = [];

  sections.push(`[MASTER RULES] ${STICKER_MASTER_RULES}`);

  if (state.niche) {
    sections.push(`[NICHE] ${state.niche}`);
  }
  if (state.targetAudience) {
    sections.push(`[AUDIENCE] ${state.targetAudience}`);
  }
  if (state.quote) {
    sections.push(`[TEXT ON STICKER] ${state.quote}`);
  }
  if (state.visualStyle) {
    sections.push(`[VISUAL STYLE] ${state.visualStyle}`);
  }
  if (state.imageDescription) {
    sections.push(`[IMAGE DESCRIPTION] ${state.imageDescription}`);
  }
  if (state.layoutStructure) {
    sections.push(`[LAYOUT STRUCTURE] ${state.layoutStructure}`);
  }

  return sections.join("\n");
}

export default function StickerGeneratorPage() {
  const [formState, setFormState] =
    useState<StickerFormState>(DEFAULT_FORM_STATE);
  const [results, setResults] = useState<StickerResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelConfig[]>([]);
  const [suggestedModel, setSuggestedModel] = useState<ModelId | undefined>();

  const uploadedFileRef = useRef<File | null>(null);

  // Fetch available models on mount
  useEffect(() => {
    fetch("/sticker-generator/api/generate")
      .then((res) => res.json())
      .then((data) => {
        if (data.models) {
          setAvailableModels(data.models);
        }
      })
      .catch((err) => console.error("Failed to load models:", err));
  }, []);

  // --- Form State Handlers ---

  const handleFormChange = useCallback(
    (updates: Partial<StickerFormState>) => {
      setFormState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const handleImageUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    uploadedFileRef.current = file;
    setFormState((prev) => ({ ...prev, uploadedImageUrl: url }));
  }, []);

  const handleImageDelete = useCallback(() => {
    if (formState.uploadedImageUrl) {
      URL.revokeObjectURL(formState.uploadedImageUrl);
    }
    uploadedFileRef.current = null;
    setFormState(DEFAULT_FORM_STATE);
  }, [formState.uploadedImageUrl]);

  // --- Analysis ---

  const handleAnalyze = useCallback(async () => {
    const file = uploadedFileRef.current;
    if (!file) return;

    setIsAnalyzing(true);

    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type || "image/png";

      const apiKey = getStoredApiKey() || "";
      const response = await fetch("/sticker-generator/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey,
        },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        const analysis: StickerAnalysis = data.analysis;

        setFormState((prev) => ({
          ...prev,
          niche: analysis.niche ?? "",
          targetAudience: analysis.targetAudience ?? "",
          quote: analysis.quote ?? "",
          visualStyle: analysis.visualStyle ?? "",
          imageDescription: analysis.imageDescription ?? "",
          layoutStructure: analysis.layoutStructure ?? "",
        }));

        console.log("=== ANALYSIS COMPLETE ===", analysis);
      } else {
        console.error("Analysis failed:", data.error);
        alert(`Analysis failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Analysis request error:", error);
      alert(
        "Failed to connect to analysis service. Check your API key and try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleRefine = useCallback(async (modifications: string) => {
    setIsRefining(true);

    try {
      const apiKey = getStoredApiKey() || "";
      const response = await fetch("/sticker-generator/api/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey,
        },
        body: JSON.stringify({
          currentState: formState,
          modifications,
        }),
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        const analysis: StickerAnalysis = data.analysis;

        setFormState((prev) => ({
          ...prev,
          niche: analysis.niche ?? prev.niche,
          targetAudience: analysis.targetAudience ?? prev.targetAudience,
          quote: analysis.quote ?? prev.quote,
          visualStyle: analysis.visualStyle ?? prev.visualStyle,
          imageDescription: analysis.imageDescription ?? prev.imageDescription,
          layoutStructure: analysis.layoutStructure ?? prev.layoutStructure,
        }));
      } else {
        console.error("Refine failed:", data.error);
        alert(`Failed to apply modifications: ${data.error}`);
      }
    } catch (error) {
      console.error("Refine request error:", error);
      alert("Failed to connect to refine service. Check your API key.");
    } finally {
      setIsRefining(false);
    }
  }, [formState]);

  // --- Generation ---

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setResults([]); // Clear previous results to show skeletons

    const prompt = buildGenerationPrompt(formState);

    try {
      const apiKey = getStoredApiKey() || "";
      const response = await fetch("/sticker-generator/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey,
        },
        body: JSON.stringify({
          prompt,
          variations: formState.variations,
          selectedModel: formState.selectedModel,
          quote: formState.quote,
        }),
      });

      const data = await response.json();

      // Track which model was auto-selected
      if (data.suggestedModel) {
        setSuggestedModel(data.suggestedModel);
      }

      if (data.success && data.images && data.images.length > 0) {
        const newResults: StickerResult[] = data.images.map(
          (imageUrl: string) => ({
            id: crypto.randomUUID(),
            imageUrl,
            prompt,
            modelId: data.modelId,
          })
        );
        setResults(newResults);
      } else {
        console.error("Generation failed:", data.error);
        alert(`Generation failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Generation request error:", error);
      alert(
        "Failed to connect to generation service. Check your API key and try again."
      );
    } finally {
      setIsGenerating(false);
    }
  }, [formState]);

  // --- Result Actions ---

  const handleRefresh = useCallback(
    (id: string) => {
      console.log("Refresh sticker:", id);
    },
    []
  );

  const handleDownload = useCallback(
    (id: string) => {
      const result = results.find((r) => r.id === id);
      if (!result) return;
      const a = document.createElement("a");
      a.href = result.imageUrl;
      a.download = `sticker-${id}.png`;
      a.click();
    },
    [results]
  );

  const handleCopy = useCallback(
    (id: string) => {
      const result = results.find((r) => r.id === id);
      if (result) {
        navigator.clipboard.writeText(result.imageUrl);
      }
    },
    [results]
  );

  const handleDelete = useCallback((id: string) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    setResults([]);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <TopNav />
      <main className="flex flex-1 overflow-hidden">
        <SourceSidebar
          uploadedImageUrl={formState.uploadedImageUrl}
          onImageUpload={handleImageUpload}
          onImageDelete={handleImageDelete}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
        />
        <AnalyticsPanel
          formState={formState}
          onFormChange={handleFormChange}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          availableModels={availableModels}
          suggestedModel={suggestedModel}
          onRefine={handleRefine}
          isRefining={isRefining}
        />
        <ResultGrid
          results={results}
          isGenerating={isGenerating}
          skeletonCount={formState.variations}
          onRefresh={handleRefresh}
          onDownload={handleDownload}
          onCopy={handleCopy}
          onDelete={handleDelete}
          onClearAll={handleClearAll}
        />
      </main>
    </div>
  );
}
