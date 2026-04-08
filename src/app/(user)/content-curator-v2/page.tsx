"use client";

import { useState, useCallback, useMemo } from "react";
import ProductAsset from "../content-curator/components/ProductAsset";
import SkillConfig, { getLocalSkillContent } from "../content-curator/components/SkillConfig";
import ContentCanvas from "../content-curator/components/ContentCanvas";
import KeywordAssigner, { type KeywordAssignments } from "./components/KeywordAssigner";
import { getCuratorHeaders } from "../content-curator/lib/curator-keys";
import { getStoredModel } from "../content-curator/components/ContentCuratorNav";
import type { ContentListing } from "../content-curator/lib/types";

const EMPTY_ASSIGNMENTS: KeywordAssignments = { title: [], bullets: [], description: [] };

/** Parse raw keyword textarea → array of strings (strip volume suffix) */
function parseKeywordsToArray(raw: string): string[] {
  const lines = raw.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const kw = line.replace(/\s+([\d]+|-)\s*$/, "").trim();
    if (kw && !seen.has(kw.toLowerCase())) {
      seen.add(kw.toLowerCase());
      result.push(kw);
    }
  }
  return result;
}

export default function ContentCuratorV2Page() {
  // ─── Input state ────────────────────────────────────────────────────────────
  const [productImage, setProductImage] = useState<string | null>(null);
  const [keywords, setKeywords] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("Editorial_Pro_V2.md");
  const [enableOccasion, setEnableOccasion] = useState(false);
  const [occasion, setOccasion] = useState("Everyday");
  const [notes, setNotes] = useState("");

  // ─── V2-specific state ──────────────────────────────────────────────────────
  const [assignments, setAssignments] = useState<KeywordAssignments>(EMPTY_ASSIGNMENTS);
  const [bulletCount, setBulletCount] = useState(5);

  // ─── Output state ───────────────────────────────────────────────────────────
  const [content, setContent] = useState<ContentListing | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveContentText, setLiveContentText] = useState("");
  const [liveTitle, setLiveTitle] = useState("");

  // Derive unassigned keywords
  const allKeywords = useMemo(() => parseKeywordsToArray(keywords), [keywords]);
  const assignedSet = useMemo(
    () => new Set([...assignments.title, ...assignments.bullets, ...assignments.description]),
    [assignments]
  );
  const unassignedKeywords = useMemo(
    () => allKeywords.filter((k) => !assignedSet.has(k)),
    [allKeywords, assignedSet]
  );

  const canGenerate = allKeywords.length > 0;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setError(null);

    try {
      const { geminiKey, vertexKey, vertexJson } = getCuratorHeaders();
      const response = await fetch("/content-curator-v2/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": geminiKey ?? "",
          "x-curator-vertex-key": vertexKey ?? "",
          "x-curator-vertex-json": vertexJson ?? "",
        },
        body: JSON.stringify({
          keywordAssignments: {
            title: assignments.title.filter((k) => allKeywords.includes(k)),
            bullets: assignments.bullets.filter((k) => allKeywords.includes(k)),
            description: assignments.description.filter((k) => allKeywords.includes(k)),
          },
          unassignedKeywords,
          skillName: selectedSkill,
          bulletCount,
          model: getStoredModel(),
          ...(enableOccasion && { occasion }),
          ...(notes.trim() && { notes: notes.trim() }),
          ...(productImage && { image: productImage }),
          ...(getLocalSkillContent(selectedSkill) !== null && {
            skillContent: getLocalSkillContent(selectedSkill)!,
          }),
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
  }, [
    canGenerate, assignments, unassignedKeywords, allKeywords,
    selectedSkill, bulletCount, enableOccasion, occasion, notes, productImage,
  ]);

  return (
    <div className="flex flex-col lg:flex-row h-full w-full divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">

      {/* ── Col 1: Image + Skill + Keyword input ─────────────────────────── */}
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
          /* Generate is triggered from Col 2 in V2 — disable button here */
          onGenerate={() => {}}
          isGenerating={false}
          canGenerate={false}
        />

        {/* Keyword textarea — below SkillConfig in Col 1 */}
        <div className="p-5 flex flex-col gap-3">
          <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#EA580C] text-[15px] rotate-45">key</span>
            Keywords
          </label>
          <textarea
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="h-[160px] w-full resize-none rounded-lg bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 p-3 text-[13px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#EA580C] focus:border-[#EA580C] transition-shadow"
            placeholder={"Enter keywords (optionally with volume):\nfunny cat stickers 12000\ncat decal -\nvinyl sticker"}
            spellCheck={false}
          />
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {allKeywords.length > 0 ? `${allKeywords.length} keywords parsed` : "Paste from Helium10, Cerebro, etc."}
          </div>
        </div>

        {error && (
          <div className="rounded-none bg-red-50 dark:bg-red-950/30 px-5 py-4 text-[13px] text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* ── Col 2: Keyword Assigner + Bullet stepper + Generate ──────────── */}
      <div className="flex flex-col w-full lg:w-[400px] shrink-0 min-h-[500px] h-full overflow-y-auto">
        <KeywordAssigner
          keywords={keywords}
          assignments={assignments}
          onAssignmentsChange={setAssignments}
          bulletCount={bulletCount}
          onBulletCountChange={setBulletCount}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          canGenerate={canGenerate}
        />
      </div>

      {/* ── Col 3: Content Canvas ─────────────────────────────────────────── */}
      <div className="flex flex-col w-full flex-1 relative bg-zinc-50/30 dark:bg-zinc-950/30">
        <ContentCanvas
          content={content}
          isGenerating={isGenerating}
          bankKeywords={keywords}
          skillName={selectedSkill}
          titleOverride={liveTitle}
          onContentChange={(live) => {
            setLiveTitle(live.title);
            const allText = [live.title, ...live.bullets, live.description, live.searchTerms ?? ""].join(" ");
            setLiveContentText(allText);
          }}
        />
      </div>
    </div>
  );
}
