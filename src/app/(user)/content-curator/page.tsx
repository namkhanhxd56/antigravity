"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import ProductAsset from "./components/ProductAsset";
import SkillConfig from "./components/SkillConfig";
import ContentCanvas from "./components/ContentCanvas";
import CompareView from "./components/CompareView";
import KeywordAssigner, { type KeywordAssignments } from "./components/KeywordAssigner";
import KeywordCoverage from "./components/KeywordCoverage";
import { getCuratorHeaders } from "./lib/curator-keys";
import { getStoredModel } from "./components/ContentCuratorNav";
import { initPool, scanUsed, consumeStep, getRemainingKeywords } from "./lib/keywordPool";
import { useContentLimits } from "./lib/useContentLimits";
import type { ContentListing, ImageAnalysis, PipelineStage, PipelineVersion, KeywordAssignments as KWAssignments } from "./lib/types";
import { useCuratorMode } from "./lib/ModeContext";

// ─── DEV ONLY ─────────────────────────────────────────────────────────────────
// import DevInspector from "./components/DevInspector";
// const DEV_INSPECTOR = true;
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_ASSIGNMENTS: KWAssignments = { title: [], bullets: [], description: [] };

/** Parse raw keyword textarea → deduplicated array (strips volume suffix) */
function parseKeywordsToArray(raw: string): string[] {
  const lines = raw.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const kw = line.replace(/\s+(\d+|-)\s*$/, "").trim();
    if (kw && !seen.has(kw.toLowerCase())) {
      seen.add(kw.toLowerCase());
      result.push(kw);
    }
  }
  return result;
}

export default function ContentCuratorPage() {
  // ─── Input state ────────────────────────────────────────────────────────────
  const [productImage, setProductImage] = useState<string | null>(null);
  const [keywords, setKeywords] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("Editorial_Pro_V2.md");
  const [skillContent, setSkillContent] = useState("");
  const [enableOccasion, setEnableOccasion] = useState(false);
  const [occasion, setOccasion] = useState("Everyday");
  const [notes, setNotes] = useState("");

  // ─── V3: Keyword assignments + bullet count ──────────────────────────────
  const [assignments, setAssignments] = useState<KWAssignments>(EMPTY_ASSIGNMENTS);
  const [bulletCount, setBulletCount] = useState(5);

  // ─── Pipeline version ────────────────────────────────────────────────────────
  const [pipelineVersion, setPipelineVersion] = useState<PipelineVersion>("v1");

  // ─── Output state ───────────────────────────────────────────────────────────
  const [content, setContent] = useState<ContentListing | null>(null);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveTitle, setLiveTitle] = useState("");

  // ─── Keyword analytics ──────────────────────────────────────────────────────
  /** Keywords remaining after pipeline (for generic keywords suggestion) */
  const [remainingKeywords, setRemainingKeywords] = useState<string[]>([]);
  /** Count of occurrences per keyword in generated content (lowercase keys) */
  const [usedKeywordCounts, setUsedKeywordCounts] = useState<Record<string, number>>({});

  const { limits } = useContentLimits();
  const { mode } = useCuratorMode();

  const allKeywords = useMemo(() => parseKeywordsToArray(keywords), [keywords]);
  const canGenerate = allKeywords.length > 0;

  // Sync assignments: remove keywords that no longer exist in the bank
  useEffect(() => {
    const kwSet = new Set(allKeywords.map((k) => k.toLowerCase()));
    const needsClean =
      assignments.title.some((k) => !kwSet.has(k.toLowerCase())) ||
      assignments.bullets.some((k) => !kwSet.has(k.toLowerCase())) ||
      assignments.description.some((k) => !kwSet.has(k.toLowerCase()));
    if (needsClean) {
      setAssignments({
        title: assignments.title.filter((k) => kwSet.has(k.toLowerCase())),
        bullets: assignments.bullets.filter((k) => kwSet.has(k.toLowerCase())),
        description: assignments.description.filter((k) => kwSet.has(k.toLowerCase())),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allKeywords]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Get auth headers for API calls */
  const getHeaders = useCallback(() => {
    const { geminiKey, vertexKey, vertexJson } = getCuratorHeaders();
    return {
      "Content-Type": "application/json",
      "x-gemini-api-key": geminiKey ?? "",
      "x-curator-vertex-key": vertexKey ?? "",
      "x-curator-vertex-json": vertexJson ?? "",
      "x-curator-model": getStoredModel() ?? "",
    };
  }, []);

  // ─── Sequential Pipeline ─────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setError(null);
    setContent(null);
    setRemainingKeywords([]);
    setUsedKeywordCounts({});

    // Init keyword pool
    let pool = initPool(keywords, assignments);

    const authHeaders = getHeaders();
    const baseBody = {
      limits,
      notes: notes.trim() || undefined,
      occasion: enableOccasion ? occasion : undefined,
      model: getStoredModel(),
    };

    try {
      // ── Step 0: Image Analysis ─────────────────────────────────────────────
      let imageAnalysis: ImageAnalysis | null = null;
      if (productImage) {
        setPipelineStage("image");
        try {
          const res = await fetch("/content-curator/api/analyze-image", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({ image: productImage }),
          });
          const data = await res.json();
          if (data.success) imageAnalysis = data.analysis;
        } catch {
          // Image analysis failure is non-fatal — continue without it
          console.warn("[pipeline] image analysis failed, continuing without it");
        }
      }

      // ── Step 1: Title ──────────────────────────────────────────────────────
      setPipelineStage("title");
      const titleRes = await fetch("/content-curator/api/generate-title", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          ...baseBody,
          skillContent,
          assignedKeywords: pool.assigned.title,
          availablePool: pool.available_pool,
          imageAnalysis,
        }),
      });
      const titleData = await titleRes.json();
      if (!titleData.success) throw new Error(titleData.error ?? "Title generation failed");

      const titleText: string = titleData.title ?? "";

      // Scan used keywords, update pool
      const usedInTitle = scanUsed(titleText, [...pool.assigned.title, ...pool.available_pool]);
      pool = consumeStep(pool, usedInTitle, "title");

      // Update content progressively
      setContent({ title: titleText, bullets: [], description: "", searchTerms: "" });

      // ── Step 2: Bullets ────────────────────────────────────────────────────
      setPipelineStage("bullets");
      const bulletsRes = await fetch("/content-curator/api/generate-bullets", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          ...baseBody,
          skillContent,
          titleText,
          assignedKeywords: pool.assigned.bullets,
          availablePool: pool.available_pool,
          bulletCount,
          imageAnalysis,
        }),
      });
      const bulletsData = await bulletsRes.json();
      if (!bulletsData.success) throw new Error(bulletsData.error ?? "Bullets generation failed");

      const bulletsArr: string[] = bulletsData.bullets ?? [];
      const bulletsText = bulletsArr.join(" ");

      // Scan used keywords, update pool
      const usedInBullets = scanUsed(bulletsText, [...pool.assigned.bullets, ...pool.available_pool]);
      pool = consumeStep(pool, usedInBullets, "bullets");

      // Update content progressively
      setContent({ title: titleText, bullets: bulletsArr, description: "", searchTerms: "" });

      // ── Step 3: Description ────────────────────────────────────────────────
      setPipelineStage("description");
      const descRes = await fetch("/content-curator/api/generate-description", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          ...baseBody,
          skillContent,
          titleText,
          bulletsText: bulletsArr,
          assignedKeywords: pool.assigned.description,
          availablePool: pool.available_pool,
          imageAnalysis,
        }),
      });
      const descData = await descRes.json();
      if (!descData.success) throw new Error(descData.error ?? "Description generation failed");

      const descriptionText: string = descData.description ?? "";

      // Scan used keywords, update pool
      const usedInDesc = scanUsed(descriptionText, [...pool.assigned.description, ...pool.available_pool]);
      pool = consumeStep(pool, usedInDesc, "description");

      // Final content
      setContent({ title: titleText, bullets: bulletsArr, description: descriptionText, searchTerms: "" });
      setRemainingKeywords(getRemainingKeywords(pool));

      // Compute per-keyword usage counts across all generated content
      const fullText = [titleText, ...bulletsArr, descriptionText].join(" ");
      const counts: Record<string, number> = {};
      for (const kw of allKeywords) {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const matches = fullText.match(new RegExp(escaped, "gi"));
        if (matches && matches.length > 0) {
          counts[kw.toLowerCase()] = matches.length;
        }
      }
      setUsedKeywordCounts(counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
      setPipelineStage(null);
    }
  }, [
    canGenerate, keywords, assignments, bulletCount, limits,
    notes, enableOccasion, occasion, productImage, getHeaders, skillContent,
  ]);

  return (
    <div className="flex flex-col lg:flex-row h-full w-full divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">

      {/* ── Col 1: Image + Skill + Keyword input ─────────────────────────── */}
      <div className="flex flex-col w-full lg:w-[320px] shrink-0 divide-y divide-zinc-200 dark:divide-zinc-800">
        <ProductAsset onChange={setProductImage} />

        {/* Keyword textarea */}
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

        <KeywordCoverage
          keywords={keywords}
          usedKeywordCounts={usedKeywordCounts}
        />

        <SkillConfig
          selectedSkill={selectedSkill}
          onSkillChange={setSelectedSkill}
          enableOccasion={enableOccasion}
          onEnableOccasionChange={setEnableOccasion}
          occasion={occasion}
          onOccasionChange={setOccasion}
          notes={notes}
          onNotesChange={setNotes}
          onGenerate={() => {}}
          isGenerating={false}
          canGenerate={false}
          onSkillSplit={() => {}}
          onSkillContentLoaded={setSkillContent}
          showGenerateButton={false}
        />

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 px-5 py-4 text-[13px] text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Remaining Keywords hidden — highlights shown in Keyword Assigner */}
      </div>

      {/* ── Col 2: Keyword Assigner + Generate ───────────────────────────── */}
      <div className="flex flex-col w-full lg:w-[400px] shrink-0 min-h-[500px] h-full overflow-y-auto">
        <KeywordAssigner
          keywords={keywords}
          assignments={assignments as KeywordAssignments}
          onAssignmentsChange={setAssignments}
          bulletCount={bulletCount}
          onBulletCountChange={setBulletCount}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          canGenerate={canGenerate}
          usedKeywordCounts={usedKeywordCounts}
          pipelineVersion={pipelineVersion}
          onVersionChange={setPipelineVersion}
        />
      </div>

      {/* ── Col 3: Content Canvas ─────────────────────────────────────────── */}
      <div className="flex flex-col w-full flex-1 relative bg-zinc-50/30 dark:bg-zinc-950/30">
        <div className={mode !== "create" ? "hidden" : ""}>
          <ContentCanvas
            content={content}
            isGenerating={isGenerating}
            generatingSection={pipelineStage === "image" ? null : pipelineStage}
            bankKeywords={keywords}
            skillName={selectedSkill}
            titleOverride={liveTitle}
            remainingKeywords={remainingKeywords}
            usedKeywordCounts={usedKeywordCounts}
            onContentChange={(live) => {
              if (mode !== "create") return;
              setLiveTitle(live.title);
              // Recompute keyword usage — include searchTerms so generic keywords also highlight orange
              const fullText = [live.title, ...live.bullets, live.description, live.searchTerms ?? ""].join(" ");
              const counts: Record<string, number> = {};
              for (const kw of allKeywords) {
                const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const matches = fullText.match(new RegExp(escaped, "gi"));
                if (matches?.length) counts[kw.toLowerCase()] = matches.length;
              }
              setUsedKeywordCounts(counts);
            }}
          />
        </div>
        <div className={mode !== "compare" ? "hidden" : ""}>
          <CompareView
            myTitle={liveTitle}
            onMyTitleChange={setLiveTitle}
            bankKeywords={keywords}
          />
        </div>
      </div>
    </div>
  );
}
