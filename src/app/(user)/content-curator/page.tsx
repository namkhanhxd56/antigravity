"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import ProductAsset from "./components/ProductAsset";
import SkillConfig from "./components/SkillConfig";
import ContentCanvas from "./components/ContentCanvas";
import CompareView from "./components/CompareView";
import CompetitorView, { type CompetitorInput } from "./components/CompetitorView";
import KeywordAssigner, { type KeywordAssignments } from "./components/KeywordAssigner";
import KeywordCoverage from "./components/KeywordCoverage";
import { getCuratorHeaders } from "./lib/curator-keys";
import { getStoredModel } from "./components/ContentCuratorNav";
import { initPool, scanUsed, consumeStep, getRemainingKeywords } from "./lib/keywordPool";
import { loadSplitFromStorage } from "./lib/skillSplitter";
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
  const [hasCanvasContent, setHasCanvasContent] = useState(false);

  // ─── Competitor mode state ───────────────────────────────────────────────────
  const [competitorContent, setCompetitorContent] = useState<ContentListing | null>(null);
  const [isGeneratingCompetitor, setIsGeneratingCompetitor] = useState(false);
  const [hasCompetitorContent, setHasCompetitorContent] = useState(false);

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

  // ─── Shared: compute per-keyword counts from full generated text ────────────
  const computeCounts = useCallback((fullText: string) => {
    const counts: Record<string, number> = {};
    for (const kw of allKeywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matches = fullText.match(new RegExp(escaped, "gi"));
      if (matches && matches.length > 0) counts[kw.toLowerCase()] = matches.length;
    }
    return counts;
  }, [allKeywords]);

  // ─── V1 Pipeline (Sequential, zone-locked pool) ───────────────────────────────
  // ─── V2 Pipeline (Sequential, cascade push-down) ─────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setError(null);
    setContent(null);
    setRemainingKeywords([]);
    setUsedKeywordCounts({});

    const authHeaders = getHeaders();
    const baseBody = {
      limits,
      notes: notes.trim() || undefined,
      occasion: enableOccasion ? occasion : undefined,
      model: getStoredModel(),
    };

    try {
      // Load split once — used by both Step 0 (image skill) and V2 steps
      const splitData = pipelineVersion === "v2" ? loadSplitFromStorage() : null;

      // ── Step 0: Image Analysis (shared) ───────────────────────────────────
      let imageAnalysis: ImageAnalysis | null = null;
      if (productImage) {
        setPipelineStage("image");
        try {
          const res = await fetch("/content-curator/api/analyze-image", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              image: productImage,
              skillImageContent: splitData?.split.image ?? "",
            }),
          });
          const data = await res.json();
          if (data.success) imageAnalysis = data.analysis;
        } catch {
          console.warn("[pipeline] image analysis failed, continuing without it");
        }
      }

      if (pipelineVersion === "v1") {
        // ── V1: Zone-locked sequential pool ─────────────────────────────────
        let pool = initPool(keywords, assignments);

        // Step 1: Title
        setPipelineStage("title");
        const titleRes = await fetch("/content-curator/api/generate-title", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            ...baseBody, skillContent,
            assignedKeywords: pool.assigned.title,
            availablePool: pool.available_pool,
            imageAnalysis,
          }),
        });
        const titleData = await titleRes.json();
        if (!titleData.success) throw new Error(titleData.error ?? "Title generation failed");
        const titleText: string = titleData.title ?? "";

        pool = consumeStep(pool, scanUsed(titleText, [...pool.assigned.title, ...pool.available_pool]), "title");
        setContent({ title: titleText, bullets: [], description: "", searchTerms: "" });

        // Step 2: Bullets
        setPipelineStage("bullets");
        const bulletsRes = await fetch("/content-curator/api/generate-bullets", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            ...baseBody, skillContent, titleText,
            assignedKeywords: pool.assigned.bullets,
            availablePool: pool.available_pool,
            bulletCount, imageAnalysis,
          }),
        });
        const bulletsData = await bulletsRes.json();
        if (!bulletsData.success) throw new Error(bulletsData.error ?? "Bullets generation failed");
        const bulletsArr: string[] = bulletsData.bullets ?? [];

        pool = consumeStep(pool, scanUsed(bulletsArr.join(" "), [...pool.assigned.bullets, ...pool.available_pool]), "bullets");
        setContent({ title: titleText, bullets: bulletsArr, description: "", searchTerms: "" });

        // Step 3: Description
        setPipelineStage("description");
        const descRes = await fetch("/content-curator/api/generate-description", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            ...baseBody, skillContent, titleText, bulletsText: bulletsArr,
            assignedKeywords: pool.assigned.description,
            availablePool: pool.available_pool,
            imageAnalysis,
          }),
        });
        const descData = await descRes.json();
        if (!descData.success) throw new Error(descData.error ?? "Description generation failed");
        const descriptionText: string = descData.description ?? "";

        pool = consumeStep(pool, scanUsed(descriptionText, [...pool.assigned.description, ...pool.available_pool]), "description");

        setContent({ title: titleText, bullets: bulletsArr, description: descriptionText, searchTerms: "" });
        setRemainingKeywords(getRemainingKeywords(pool));
        setUsedKeywordCounts(computeCounts([titleText, ...bulletsArr, descriptionText].join(" ")));

      } else {
        // ── V2: Cascade push-down pool + split skill sections ────────────────
        const v2TitleSkill   = splitData?.split.title       || skillContent;
        const v2BulletsSkill = splitData?.split.bullets     || skillContent;
        const v2DescSkill    = splitData?.split.description || skillContent;

        const isUsedKw = (kw: string, used: string[]) =>
          used.some((u) => u.toLowerCase() === kw.toLowerCase());

        const allAssigned = new Set([
          ...assignments.title.map((k) => k.toLowerCase()),
          ...assignments.bullets.map((k) => k.toLowerCase()),
          ...assignments.description.map((k) => k.toLowerCase()),
        ]);
        let v2Pool = allKeywords.filter((k) => !allAssigned.has(k.toLowerCase()));
        const v2Assigned = {
          title: [...assignments.title],
          bullets: [...assignments.bullets],
          description: [...assignments.description],
        };

        // Step 1: Title
        setPipelineStage("title");
        const titleRes = await fetch("/content-curator/api/generate-title", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            ...baseBody, skillContent: v2TitleSkill,
            assignedKeywords: v2Assigned.title,
            availablePool: v2Pool,
            imageAnalysis,
          }),
        });
        const titleData = await titleRes.json();
        if (!titleData.success) throw new Error(titleData.error ?? "Title generation failed");
        const titleText: string = titleData.title ?? "";

        // Push-down: unused title-assigned → bullets assigned (must-use)
        const usedInTitle = scanUsed(titleText, [...v2Assigned.title, ...v2Pool]);
        const unusedTitleAssigned = v2Assigned.title.filter((k) => !isUsedKw(k, usedInTitle));
        v2Assigned.bullets = [...unusedTitleAssigned, ...v2Assigned.bullets];
        v2Assigned.title = [];
        v2Pool = v2Pool.filter((k) => !isUsedKw(k, usedInTitle));

        setContent({ title: titleText, bullets: [], description: "", searchTerms: "" });

        // Step 2: Bullets
        setPipelineStage("bullets");
        const bulletsRes = await fetch("/content-curator/api/generate-bullets", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            ...baseBody, skillContent: v2BulletsSkill, titleText,
            assignedKeywords: v2Assigned.bullets,
            availablePool: v2Pool,
            bulletCount, imageAnalysis,
          }),
        });
        const bulletsData = await bulletsRes.json();
        if (!bulletsData.success) throw new Error(bulletsData.error ?? "Bullets generation failed");
        const bulletsArr: string[] = bulletsData.bullets ?? [];

        // Push-down: unused bullets-assigned → description assigned (must-use)
        const usedInBullets = scanUsed(bulletsArr.join(" "), [...v2Assigned.bullets, ...v2Pool]);
        const unusedBulletsAssigned = v2Assigned.bullets.filter((k) => !isUsedKw(k, usedInBullets));
        v2Assigned.description = [...unusedBulletsAssigned, ...v2Assigned.description];
        v2Assigned.bullets = [];
        v2Pool = v2Pool.filter((k) => !isUsedKw(k, usedInBullets));

        setContent({ title: titleText, bullets: bulletsArr, description: "", searchTerms: "" });

        // Step 3: Description
        setPipelineStage("description");
        const descRes = await fetch("/content-curator/api/generate-description", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            ...baseBody, skillContent: v2DescSkill, titleText, bulletsText: bulletsArr,
            assignedKeywords: v2Assigned.description,
            availablePool: v2Pool,
            imageAnalysis,
          }),
        });
        const descData = await descRes.json();
        if (!descData.success) throw new Error(descData.error ?? "Description generation failed");
        const descriptionText: string = descData.description ?? "";

        const usedInDesc = scanUsed(descriptionText, [...v2Assigned.description, ...v2Pool]);
        const finalRemaining = [
          ...v2Assigned.description.filter((k) => !isUsedKw(k, usedInDesc)),
          ...v2Pool.filter((k) => !isUsedKw(k, usedInDesc)),
        ];

        setContent({ title: titleText, bullets: bulletsArr, description: descriptionText, searchTerms: "" });
        setRemainingKeywords(finalRemaining);
        setUsedKeywordCounts(computeCounts([titleText, ...bulletsArr, descriptionText].join(" ")));
      }

    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
      setPipelineStage(null);
    }
  }, [
    canGenerate, keywords, allKeywords, assignments, bulletCount, limits,
    notes, enableOccasion, occasion, productImage, getHeaders, skillContent,
    pipelineVersion, computeCounts,
  ]);

  const handleGenerateCompetitor = useCallback(async (input: CompetitorInput) => {
    setIsGeneratingCompetitor(true);
    setError(null);
    setCompetitorContent(null);

    const authHeaders = getHeaders();

    try {
      // Step 0: analyze-image (optional)
      let imageAnalysis: ImageAnalysis | null = null;
      if (productImage) {
        const imgRes = await fetch("/content-curator/api/analyze-image", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ image: productImage }),
        });
        const imgData = await imgRes.json();
        if (imgData.success) imageAnalysis = imgData.analysis;
      }

      // Step 1: generate from competitor
      const res = await fetch("/content-curator/api/generate-competitor", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          competitorTitle: input.title,
          competitorBullets: input.bullets,
          competitorDescription: input.description,
          keywords: allKeywords,
          imageAnalysis,
          bulletCount,
          limits,
          model: getStoredModel(),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Generation failed");

      const result: ContentListing = {
        title: data.title ?? "",
        bullets: data.bullets ?? [],
        description: data.description ?? "",
        searchTerms: "",
      };
      setCompetitorContent(result);
      setUsedKeywordCounts(computeCounts([result.title, ...result.bullets, result.description].join(" ")));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Competitor generation failed.");
    } finally {
      setIsGeneratingCompetitor(false);
    }
  }, [allKeywords, bulletCount, limits, productImage, getHeaders, computeCounts]);

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

        {mode !== "competitor" && (
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
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 px-5 py-4 text-[13px] text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Remaining Keywords hidden — highlights shown in Keyword Assigner */}
      </div>

      {/* ── Col 2: Keyword Assigner / Competitor Form ────────────────────── */}
      <div className="flex flex-col w-full lg:w-[400px] shrink-0 min-h-[500px] h-full overflow-y-auto">
        {mode === "competitor" ? (
          <CompetitorView
            onGenerate={handleGenerateCompetitor}
            isGenerating={isGeneratingCompetitor}
            hasContent={hasCompetitorContent}
            onClearContent={() => {
              setCompetitorContent({ title: "", bullets: ["", "", "", "", ""], description: "", searchTerms: "" });
              setHasCompetitorContent(false);
            }}
          />
        ) : (
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
          hasContent={hasCanvasContent}
          onClearContent={() => {
            setContent({ title: "", bullets: ["", "", "", "", ""], description: "", searchTerms: "" });
            setLiveTitle("");
            setHasCanvasContent(false);
          }}
        />
        )}
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
              setHasCanvasContent(
                !!(live.title || live.bullets.some((b) => b.trim()) || live.description || live.searchTerms)
              );
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
        <div className={mode !== "competitor" ? "hidden" : ""}>
          <ContentCanvas
            content={competitorContent}
            isGenerating={isGeneratingCompetitor}
            generatingSection={isGeneratingCompetitor ? "title" : null}
            bankKeywords={keywords}
            skillName={selectedSkill}
            remainingKeywords={[]}
            usedKeywordCounts={usedKeywordCounts}
            onContentChange={(live) => {
              if (mode !== "competitor") return;
              setHasCompetitorContent(
                !!(live.title || live.bullets.some((b) => b.trim()) || live.description || live.searchTerms)
              );
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
      </div>
    </div>
  );
}
