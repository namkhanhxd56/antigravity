"use client";

import { useState, useCallback } from "react";
import ProductAsset from "./components/ProductAsset";
import SkillConfig from "./components/SkillConfig";
import KeywordBank from "./components/KeywordBank";
import ContentCanvas from "./components/ContentCanvas";
import { getStoredApiKey } from "@/lib/client-key-storage";
import type { ContentListing, SkillOption } from "./lib/types";

export default function ContentCuratorPage() {
  const [keywords, setKeywords] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<SkillOption>("Editorial_Pro_V2.md");
  const [content, setContent] = useState<ContentListing | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!keywords.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const apiKey = getStoredApiKey() || "";
      const response = await fetch("/content-curator/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey,
        },
        body: JSON.stringify({
          keywords,
          skillName: selectedSkill,
        }),
      });

      const data = await response.json();

      if (data.success && data.listing) {
        setContent(data.listing);
      } else {
        setError(data.error ?? "Generation failed. Please try again.");
      }
    } catch {
      setError("Failed to connect to generation service. Check your API key.");
    } finally {
      setIsGenerating(false);
    }
  }, [keywords, selectedSkill]);

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-12 items-start">
      {/* Left Column */}
      <div className="flex flex-col gap-6 lg:col-span-3">
        <ProductAsset />
        <SkillConfig
          selectedSkill={selectedSkill}
          onSkillChange={setSelectedSkill}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          canGenerate={keywords.trim().length > 0}
        />
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Middle Column */}
      <div className="flex flex-col lg:col-span-4 xl:col-span-3 min-h-[600px] h-full">
        <KeywordBank
          value={keywords}
          onChange={setKeywords}
        />
      </div>

      {/* Right Column */}
      <div className="flex flex-col lg:col-span-5 xl:col-span-6">
        <ContentCanvas
          content={content}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}
