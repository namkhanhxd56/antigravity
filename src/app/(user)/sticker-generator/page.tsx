"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import SourceSidebar from "./components/SourceSidebar";
import AnalyticsPanel from "./components/AnalyticsPanel";
import ResultGrid from "./components/ResultGrid";
import StickerNav from "./components/StickerNav";
import { STICKER_MASTER_RULES } from "./lib/rules";
import { fileToBase64 } from "@/lib/utils";
import { getStickerAnalysisModel } from "./lib/client-storage";
import { getStickerKey } from "./lib/sticker-keys";
import { getActiveStickerKey } from "./lib/sticker-keys";
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
  canvasColor: "#00FF00",
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
  if (state.canvasColor && state.canvasColor !== "transparent") {
    sections.push(`[CANVAS BACKGROUND COLOR] Vui lòng đổ màu nền artboard là màu ${state.canvasColor}. LƯU Ý VIỀN STICKER VẪN PHẢI LÀ MÀU TRẮNG #fefefe BẰNG MỌI GIÁ.`);
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

      const active = getActiveStickerKey();
      const response = await fetch("/sticker-generator/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sticker-key": active?.key ?? "",
          "x-sticker-key-type": active?.type ?? "",
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          model: getStickerAnalysisModel(),
        }),
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
      const active = getActiveStickerKey();
      const response = await fetch("/sticker-generator/api/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sticker-key": active?.key ?? "",
          "x-sticker-key-type": active?.type ?? "",
        },
        body: JSON.stringify({
          currentState: formState,
          modifications,
          model: getStickerAnalysisModel(),
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
      if (formState.selectedModel === "piapi-flux") {
        // Create PiAPI tasks concurrently for each variation
        const variations = Math.max(1, formState.variations);
        const piapiKey = getStickerKey("piapi") || "";
        const createTaskPromises = Array(variations).fill(0).map(() => 
          fetch("/api/piapi/flux", {
            method: "POST",
            headers: { 
               "Content-Type": "application/json",
               "x-piapi-key": piapiKey
            },
            body: JSON.stringify({ prompt, width: 1024, height: 1024 })
          })
        );
  
        const taskResponses = await Promise.all(createTaskPromises);
        const taskDatas = await Promise.all(taskResponses.map(r => r.json()));
        const taskIds = taskDatas.map(data => data.taskId).filter(Boolean);
  
        if (taskIds.length === 0) {
           throw new Error("Failed to receive any task IDs from PiAPI.");
        }
  
        setSuggestedModel("piapi-flux");
        
        const generatedResults: StickerResult[] = [];
  
        // Poll statuses concurrently
        await Promise.all(taskIds.map(async (taskId) => {
          let status = "pending";
          while (status === "pending" || status === "processing" || status === "starting") {
            await new Promise(r => setTimeout(r, 4000));
            const sRes = await fetch(`/api/piapi/status/${taskId}`, {
               headers: { "x-piapi-key": piapiKey }
            });
            const sData = await sRes.json();
            if (sData.code !== 200) throw new Error("Status check failed");
            
            status = sData.data.status;
            if (status === "completed") {
              const imageUrl = sData.data.output?.image_url || sData.data.output?.image;
              if (imageUrl) {
                generatedResults.push({
                  id: crypto.randomUUID(),
                  imageUrl,
                  prompt,
                  modelId: "piapi/flux1-schnell",
                });
              }
            } else if (status === "failed") {
              throw new Error("Generation task failed on server.");
            }
          }
        }));
  
        if (generatedResults.length > 0) {
          setResults(generatedResults);
        } else {
          throw new Error("No images were successfully generated.");
        }
      } else {
        // DEFAULT Logic: Generate using Gemini/Vertex via the API Gateway
        const active = getActiveStickerKey();
        const response = await fetch("/sticker-generator/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-sticker-key": active?.key ?? "",
            "x-sticker-key-type": active?.type ?? "",
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
      }
    } catch (error) {
      console.error("Generation Error:", error);
      alert("Lỗi khi kết nối hoặc tạo ảnh. Kiểm tra lại API Key hoặc Logs Console.");
    } finally {
      setIsGenerating(false);
    }
  }, [formState]);

  // --- Result Actions ---

  const handleRefresh = useCallback(
    async (id: string, modificationPrompt?: string) => {
      const resultToRefine = results.find((r) => r.id === id);
      if (!resultToRefine) return;

      setIsGenerating(true);
      // If user provided a modification prompt, create a specialized instructions string.
      // Otherwise, just use the current formState.
      let promptConfig = buildGenerationPrompt(formState);
      if (modificationPrompt) {
        promptConfig = `[INSTRUCTION] Please modify the provided reference image based on this request: "${modificationPrompt}"\n\n[ORIGINAL DESIGN CONTEXT]:\n${promptConfig}`;
      }

      try {
        const active = getActiveStickerKey();
        const response = await fetch("/sticker-generator/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-sticker-key": active?.key ?? "",
            "x-sticker-key-type": active?.type ?? "",
          },
          body: JSON.stringify({
            prompt: promptConfig,
            variations: 1, // Only generate 1 variation when refining
            selectedModel: formState.selectedModel,
            quote: formState.quote,
            referenceImage: resultToRefine.imageUrl, // Pass generated result as inlineData
          }),
        });

        const data = await response.json();

        if (data.success && data.images && data.images.length > 0) {
          const newResult: StickerResult = {
            id: crypto.randomUUID(),
            imageUrl: data.images[0],
            prompt: promptConfig,
            modelId: data.modelId,
          };
          // Prepend to results
          setResults((prev) => [newResult, ...prev]);
        } else {
          console.error("Refine generation failed:", data.error);
          alert(`Refine generation failed: ${data.error}`);
        }
      } catch (error) {
        console.error("Refine generation request error:", error);
        alert("Failed to connect to generation service. Check your API key and try again.");
      } finally {
        setIsGenerating(false);
      }
    },
    [formState, results]
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
      <StickerNav />
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
