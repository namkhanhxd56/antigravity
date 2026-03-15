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
}

export default function AnalyticsPanel({
  formState,
  onFormChange,
  onGenerate,
  isGenerating,
  availableModels,
  suggestedModel,
}: AnalyticsPanelProps) {
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary">
            analytics
          </span>
          <h2 className="text-2xl font-bold text-slate-900">
            Analysis Insights
          </h2>
        </div>

        {/* Niche & Audience */}
        <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">groups</span>
            NICHE &amp; TARGET AUDIENCE
          </h3>
          <div className="space-y-2">
            <input
              className="w-full bg-transparent text-lg font-semibold text-slate-900 outline-none placeholder-slate-400"
              value={formState.niche}
              onChange={(e) => onFormChange({ niche: e.target.value })}
              placeholder="e.g., Funny Firefighter, Pet Lovers, Motivational Quotes"
            />
            <input
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder-slate-400"
              value={formState.targetAudience}
              onChange={(e) => onFormChange({ targetAudience: e.target.value })}
              placeholder="e.g., Gen-Z designers, urban fashion enthusiasts, Corporate employee"
            />
          </div>
        </div>

        {/* Extracted Text */}
        <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-500 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">
                format_quote
              </span>
              EXTRACTED TEXT
            </h3>
            <button
              onClick={() => navigator.clipboard.writeText(formState.quote)}
              className="text-xs flex items-center gap-1 text-primary font-bold hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined text-xs">
                content_copy
              </span>
              Copy Text
            </button>
          </div>
          <textarea
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-primary focus:border-primary resize-none h-20 outline-none placeholder-slate-400"
            placeholder="Visible text or quote on the sticker..."
            value={formState.quote}
            onChange={(e) => onFormChange({ quote: e.target.value })}
          />
        </div>

        {/* Visual Style & Tone */}
        <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">lightbulb</span>
            VISUAL STYLE &amp; TONE
          </h3>
          <input
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-primary focus:border-primary outline-none placeholder-slate-400"
            value={formState.style}
            onChange={(e) => onFormChange({ style: e.target.value })}
            placeholder="e.g., Cyberpunk, Kawaii, edgy, playful, motivational"
          />
        </div>

        {/* Extracted Elements */}
        <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">category</span>
            EXTRACTED ELEMENTS
          </h3>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {formState.extractedElements.map((el) => (
              <div
                key={el.id}
                className="aspect-square relative rounded-lg overflow-hidden border border-slate-300 group"
              >
                <img
                  alt={el.label || "Element"}
                  className="w-full h-full object-cover"
                  src={el.imageUrl}
                />
                <button
                  onClick={() => handleRemoveElement(el.id)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-xs">
                    close
                  </span>
                </button>
              </div>
            ))}
            <button
              onClick={handleAddElement}
              className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors"
            >
              <span className="material-symbols-outlined">add</span>
              <span className="text-[10px] mt-1 font-bold uppercase">Add</span>
            </button>
          </div>

          <p className="text-xs font-bold text-slate-500 mb-2 uppercase">
            Image Description Prompt
          </p>
          <textarea
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-primary focus:border-primary resize-none h-24 outline-none placeholder-slate-400"
            placeholder="Detailed prompt for the sticker's visual style, textures, gradients, shapes..."
            value={formState.imageDescription}
            onChange={(e) =>
              onFormChange({ imageDescription: e.target.value })
            }
          />
        </div>

        {/* Layout & Composition */}
        <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">
              dashboard_customize
            </span>
            LAYOUT &amp; COMPOSITION
          </h3>
          <textarea
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-primary focus:border-primary resize-none h-20 outline-none placeholder-slate-400"
            placeholder="Layout, composition, color and typography description..."
            value={formState.layoutDescription}
            onChange={(e) =>
              onFormChange({ layoutDescription: e.target.value })
            }
          />
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
