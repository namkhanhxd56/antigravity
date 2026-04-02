"use client";

import { useState, useCallback } from "react";
import ProductAsset from "./components/ProductAsset";
import SkillConfig from "./components/SkillConfig";
import KeywordBank from "./components/KeywordBank";
import ContentCanvas from "./components/ContentCanvas";
import CompetitorView from "./components/CompetitorView";
import { getCuratorApiKey } from "./lib/client-storage";
import { getStoredModel } from "./components/ContentCuratorNav";
import type { ContentListing } from "./lib/types";
import { useCuratorMode } from "./lib/ModeContext";

// ─── DEV ONLY ─────────────────────────────────────────────────────────────────
// Để bật Dev Inspector khi làm việc local:
//   1. Uncomment 2 dòng dưới
//   2. KHÔNG commit thay đổi này (DevInspector.tsx đã nằm trong .gitignore)
//
// import DevInspector from "./components/DevInspector";
// const DEV_INSPECTOR = true;
// ─────────────────────────────────────────────────────────────────────────────

export default function ContentCuratorPage() {
  const [productImage, setProductImage] = useState<string | null>(null);
  const [keywords, setKeywords] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("Editorial_Pro_V2.md");
  const [enableOccasion, setEnableOccasion] = useState(false);
  const [occasion, setOccasion] = useState("Everyday");
  const [notes, setNotes] = useState("");
  const [content, setContent] = useState<ContentListing | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveContentText, setLiveContentText] = useState("");
  const [liveTitle, setLiveTitle] = useState("");
  // DEV: uncomment khi bật DevInspector
  // const [rawResponse, setRawResponse] = useState<string | undefined>(undefined);
  const { mode } = useCuratorMode();

  const handleGenerate = useCallback(async () => {
    if (!keywords.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const apiKey = getCuratorApiKey() || "";
      const response = await fetch("/content-curator/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey,
        },
        body: JSON.stringify({
          keywords,
          skillName: selectedSkill,
          model: getStoredModel(),
          ...(enableOccasion && { occasion }),
          ...(notes.trim() && { notes: notes.trim() }),
          ...(productImage && { image: productImage }),
        }),
      });

      const data = await response.json();

      if (data.success && data.listing) {
        setContent(data.listing);
        // DEV: uncomment khi bật DevInspector
        // if (data._debug?.rawResponse) setRawResponse(data._debug.rawResponse);
      } else {
        setError(data.error ?? "Generation failed. Please try again.");
      }
    } catch {
      setError("Failed to connect to generation service. Check your API key.");
    } finally {
      setIsGenerating(false);
    }
  }, [keywords, selectedSkill, enableOccasion, occasion, notes, productImage]);

  return (
    <div className="flex flex-col lg:flex-row h-full w-full divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
      {/* Left Column */}
      <div className="flex flex-col w-full lg:w-[320px] shrink-0 divide-y divide-zinc-200 dark:divide-zinc-800">
        <ProductAsset onChange={setProductImage} />
        <SkillConfig
          selectedSkill={selectedSkill}
          onSkillChange={setSelectedSkill}
          enableOccasion={enableOccasion}
          onEnableOccasionChange={setEnableOccasion}
          occasion={occasion}
          onOccasionChange={setOccasion}
          notes={notes}
          onNotesChange={setNotes}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          canGenerate={keywords.trim().length > 0}
          // DEV: uncomment dòng dưới sau khi bật DevInspector ở trên
          // devPanel={typeof DEV_INSPECTOR !== "undefined" && <DevInspector keywords={keywords} skillName={selectedSkill} enableOccasion={enableOccasion} occasion={occasion} notes={notes} rawResponse={rawResponse} />}
        />
        {error && (
          <div className="rounded-none bg-red-50 dark:bg-red-950/30 px-6 py-4 text-[13px] text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Middle Column */}
      <div className="flex flex-col w-full lg:w-[384px] shrink-0 min-h-[600px] h-full">
        <KeywordBank
          value={keywords}
          onChange={setKeywords}
          contentText={liveContentText}
        />
      </div>

      {/* Right Column */}
      <div className="flex flex-col w-full flex-1 relative bg-zinc-50/30 dark:bg-zinc-950/30">
        {mode === "create" ? (
          <ContentCanvas
            content={content}
            isGenerating={isGenerating}
            bankKeywords={keywords}
            skillName={selectedSkill}
            onContentChange={(live) => {
              setLiveTitle(live.title);
              const allText = [live.title, ...live.bullets, live.description, live.searchTerms].join(' ');
              setLiveContentText(allText);
            }}
          />
        ) : (
          <CompetitorView
            myTitle={liveTitle}
            bankKeywords={keywords}
          />
        )}
      </div>
    </div>
  );
}
