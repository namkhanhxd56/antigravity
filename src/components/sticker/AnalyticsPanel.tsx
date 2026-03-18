"use client";

import React from "react";
import type { StickerFormState, ExtractedElement, ModelConfig, ModelId } from "@/lib/types";

interface AnalyticsPanelProps {
  formState: StickerFormState;
  onFormChange: (updates: Partial<StickerFormState>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  availableModels: ModelConfig[];
  suggestedModel?: ModelId;
  onRefine: (modifications: string) => Promise<void>;
  isRefining: boolean;
}

export default function AnalyticsPanel({
  formState,
  onFormChange,
  onGenerate,
  isGenerating,
  availableModels,
  suggestedModel,
  onRefine,
  isRefining,
}: AnalyticsPanelProps) {
  const [isCopied, setIsCopied] = React.useState(false);
  const [modifications, setModifications] = React.useState("");

  const handleRefineSubmit = async () => {
    if (!modifications.trim()) return;
    await onRefine(modifications);
    setModifications(""); // clear after success
  };

  const handleCopyAll = () => {
    const analysisData = {
      niche: formState.niche,
      targetAudience: formState.targetAudience,
      visualStyle: formState.visualStyle,
      quote: formState.quote,
      layoutStructure: formState.layoutStructure,
    };
    navigator.clipboard.writeText(JSON.stringify(analysisData, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  const handleRemoveElement = (id: string) => {
    onFormChange({
      extractedElements: formState.extractedElements.filter(
        (el) => el.id !== id
      ),
    });
  };

  const handleAddElement = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        const newElement: ExtractedElement = {
          id: crypto.randomUUID(),
          imageUrl: url,
          label: file.name,
        };
        onFormChange({
          extractedElements: [...formState.extractedElements, newElement],
        });
      }
    };
    input.click();
  };

  // Resolve display name for auto mode
  const autoLabel = suggestedModel
    ? `Auto — ${availableModels.find((m) => m.id === suggestedModel)?.name || suggestedModel}`
    : "Auto (AI Recommended)";

  return (
    <section className="flex-1 overflow-y-auto p-8 bg-slate-50 no-scrollbar">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              analytics
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              Analysis Insights
            </h2>
          </div>
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold transition-colors rounded-lg border border-slate-200 hover:border-primary hover:text-primary bg-white shadow-sm text-slate-600"
            title="Copy all visible insights as JSON"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isCopied ? "check" : "content_copy"}
            </span>
            {isCopied ? "Copied!" : "Copy All"}
          </button>
        </div>

        {/* --- Smart Modifications --- */}
        <div className="bg-white rounded-xl border border-primary/30 shadow-sm p-4 flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">magic_button</span>
            <label className="font-bold text-sm text-slate-800">
              Smart Modifications
            </label>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full ml-auto">
              AI Powered
            </span>
          </div>
          
          <div className="flex gap-3">
            <textarea
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-primary/50 outline-none resize-none placeholder-slate-400"
              placeholder='e.g., "Make the visual style vintage retro", "Change the quote to Hello World"'
              rows={2}
              value={modifications}
              onChange={(e) => setModifications(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleRefineSubmit();
                }
              }}
              disabled={isRefining}
            />
            <button
              onClick={handleRefineSubmit}
              disabled={isRefining || !modifications.trim()}
              className="bg-primary hover:bg-primary/95 text-white font-bold rounded-lg px-6 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
            >
              {isRefining ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Applying</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>Apply</span>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* --- Unified Analysis Table --- */}
        <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 font-bold text-xs text-slate-500 uppercase w-1/4">Property</th>
                <th className="py-3 px-4 font-bold text-xs text-slate-500 uppercase w-3/4">Value (Editable)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              
              {/* Niche */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4 align-top border-r border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">category</span>
                    Niche
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">Market category or theme.</p>
                </td>
                <td className="py-0 px-0 align-top">
                  <textarea
                    className="w-full h-full min-h-[60px] p-4 bg-transparent border-none text-sm text-slate-800 focus:ring-2 focus:ring-inset focus:ring-primary outline-none resize-none placeholder-slate-400 leading-relaxed"
                    value={formState.niche}
                    onChange={(e) => onFormChange({ niche: e.target.value })}
                    placeholder='e.g., "Dark Humor", "Pet Lovers"'
                  />
                </td>
              </tr>

              {/* Target Audience */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4 align-top border-r border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">groups</span>
                    Target Audience
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">Primary buyer demographic.</p>
                </td>
                <td className="py-0 px-0 align-top">
                  <textarea
                    className="w-full h-full min-h-[60px] p-4 bg-transparent border-none text-sm text-slate-800 focus:ring-2 focus:ring-inset focus:ring-primary outline-none resize-none placeholder-slate-400 leading-relaxed"
                    value={formState.targetAudience}
                    onChange={(e) => onFormChange({ targetAudience: e.target.value })}
                    placeholder='e.g., "Millennials and Gen-Z meme lovers"'
                  />
                </td>
              </tr>

              {/* Visual Style */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4 align-top border-r border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">palette</span>
                    Visual Style
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">Style, colors & mood.</p>
                </td>
                <td className="py-0 px-0 align-top">
                  <textarea
                    className="w-full h-full min-h-[80px] p-4 bg-transparent border-none text-sm text-slate-800 focus:ring-2 focus:ring-inset focus:ring-primary outline-none resize-none placeholder-slate-400 leading-relaxed"
                    value={formState.visualStyle}
                    onChange={(e) => onFormChange({ visualStyle: e.target.value })}
                    placeholder='e.g., "Retro badge, bold outlines, warm tones"'
                  />
                </td>
              </tr>

              {/* Quote */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4 align-top border-r border-slate-100 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">format_quote</span>
                      Quote
                    </div>
                    {formState.quote && (
                      <button 
                        onClick={() => navigator.clipboard.writeText(formState.quote)}
                        className="text-primary hover:bg-primary/10 p-1 rounded transition-colors"
                        title="Copy text"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">Visible text or quote.</p>
                </td>
                <td className="py-0 px-0 align-top">
                  <textarea
                    className="w-full h-full min-h-[60px] p-4 bg-transparent border-none text-sm font-medium text-slate-900 focus:ring-2 focus:ring-inset focus:ring-primary outline-none resize-none placeholder-slate-400 leading-relaxed"
                    value={formState.quote}
                    onChange={(e) => onFormChange({ quote: e.target.value })}
                    placeholder='Exact text on sticker (if any)'
                  />
                </td>
              </tr>

              {/* Layout Structure */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4 align-top border-r border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">dashboard_customize</span>
                    Layout Structure
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">Composition & element placement.</p>
                </td>
                <td className="py-0 px-0 align-top">
                  <textarea
                    className="w-full h-full min-h-[80px] p-4 bg-transparent border-none text-sm text-slate-800 focus:ring-2 focus:ring-inset focus:ring-primary outline-none resize-none placeholder-slate-400 leading-relaxed"
                    value={formState.layoutStructure}
                    onChange={(e) => onFormChange({ layoutStructure: e.target.value })}
                    placeholder='e.g., "Circular badge style with central typography"'
                  />
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* Generation Controls */}
        <div className="pt-8 flex flex-col items-center gap-6 border-t border-slate-300">
          {/* Variations Slider */}
          <div className="w-full max-w-sm">
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="text-xs font-bold text-slate-600 uppercase">
                Variations
              </label>
              <span className="text-sm font-bold text-primary">
                {formState.variations}{" "}
                {formState.variations === 1 ? "Sticker" : "Stickers"}
              </span>
            </div>
            <input
              className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-primary"
              max={4}
              min={1}
              type="range"
              value={formState.variations}
              onChange={(e) =>
                onFormChange({ variations: Number(e.target.value) })
              }
            />
            <div className="flex justify-between mt-1 text-[10px] font-bold text-slate-500 px-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
            </div>
          </div>

          {/* Model Selector */}
          <div className="w-full max-w-sm">
            <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">
              AI Model
            </label>

            {/* Auto option */}
            <button
              onClick={() => onFormChange({ selectedModel: "auto" })}
              className={`w-full text-left p-3 rounded-lg border-2 mb-2 transition-all ${
                formState.selectedModel === "auto"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">
                  auto_awesome
                </span>
                <span className="text-sm font-bold text-slate-800">
                  Auto (AI Recommended)
                </span>
              </div>
              {formState.selectedModel === "auto" && suggestedModel && (
                <p className="text-xs text-slate-400 mt-1 ml-6">
                  Will use{" "}
                  <span className="font-semibold text-primary">
                    {availableModels.find((m) => m.id === suggestedModel)?.name}
                  </span>
                </p>
              )}
            </button>

            {/* Model list */}
            <div className="space-y-1.5">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    if (model.available)
                      onFormChange({ selectedModel: model.id });
                  }}
                  disabled={!model.available}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    formState.selectedModel === model.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : model.available
                        ? "border-slate-200 bg-white hover:border-slate-300 cursor-pointer"
                        : "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Green / Red dot */}
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          model.available ? "bg-emerald-500" : "bg-red-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-bold ${
                          model.available
                            ? "text-slate-800"
                            : "text-slate-400"
                        }`}
                      >
                        {model.name}
                      </span>
                    </div>
                    {!model.available && (
                      <span className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-full uppercase">
                        No API Key
                      </span>
                    )}
                    {model.available && formState.selectedModel === model.id && (
                      <span className="material-symbols-outlined text-primary text-sm">
                        check_circle
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-1 ml-4 ${
                      model.available ? "text-slate-400" : "text-slate-300"
                    }`}
                  >
                    {model.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-primary/30 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <span className="material-symbols-outlined">
              {isGenerating ? "hourglass_top" : "rocket_launch"}
            </span>
            {isGenerating ? "Generating..." : "Generate New Stickers"}
          </button>
        </div>
      </div>
    </section>
  );
}
