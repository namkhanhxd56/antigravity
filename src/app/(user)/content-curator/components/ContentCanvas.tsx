"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ContentListing, RewriteRequest } from "../lib/types";
import { useContentLimits } from "../lib/useContentLimits";
import { useUndoRedo } from "../lib/useUndoRedo";
import TextToolbar from "./TextToolbar";
import HighlightTextarea from "./HighlightTextarea";
import { useMemo } from "react";
import { getStoredApiKey } from "@/lib/client-key-storage";
import { getStoredModel } from "./ContentCuratorNav";

/** Strip trailing volume number or "-" from a keyword line */
function stripVolume(line: string): string {
  return line.replace(/\s+(\d+|-)\s*$/, "").trim();
}

interface ContentCanvasProps {
  content: ContentListing | null;
  isGenerating: boolean;
  /** Called whenever the user edits any field — provides live text for analytics */
  onContentChange?: (liveContent: ContentListing) => void;
  /** Raw keyword bank text (comma/newline separated) for reload feature */
  bankKeywords?: string;
  /** Active skill name — used for per-section rewrite context */
  skillName?: string;
}

// ─── RewriteBar ───────────────────────────────────────────────────────────────

interface RewriteBarProps {
  open: boolean;
  isRewriting: boolean;
  onRegen: (instruction: string) => void;
}

function RewriteBar({ open, isRewriting, onRegen }: RewriteBarProps) {
  const [instruction, setInstruction] = useState("");

  if (!open) return null;

  const handleRegen = () => {
    if (!instruction.trim() || isRewriting) return;
    onRegen(instruction.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleRegen();
    }
  };

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <input
        type="text"
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe changes… (e.g. make it more formal, add keyword 'hiking')"
        disabled={isRewriting}
        className="flex-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-[12px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#EA580C] focus:border-[#EA580C] disabled:opacity-60"
      />
      <button
        onClick={handleRegen}
        disabled={!instruction.trim() || isRewriting}
        className="flex items-center gap-1.5 rounded-md bg-[#EA580C] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#c2460a] active:bg-[#9a3808] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      >
        {isRewriting ? (
          <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
        ) : (
          <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
        )}
        {isRewriting ? "Rewriting…" : "Regen"}
      </button>
    </div>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-zinc-200 ${className}`} />
  );
}

/** Counter badge: grey when ok, red when over limit */
function Counter({ current, max }: { current: number; max: number }) {
  const over = current > max;
  return (
    <span className={`text-xs font-medium ${over ? "text-red-500 font-semibold" : "text-zinc-400"}`}>
      {current} / {max}
    </span>
  );
}

export default function ContentCanvas({ content, isGenerating, onContentChange, bankKeywords = "", skillName = "Editorial_Pro_V2.md" }: ContentCanvasProps) {
  const { limits } = useContentLimits();
  const [title, setTitle] = useState("");
  const [bullets, setBullets] = useState<string[]>(["", "", "", "", ""]);
  const [description, setDescription] = useState("");
  const [searchTerms, setSearchTerms] = useState("");
  const [showCopyPopup, setShowCopyPopup] = useState(false);

  // ── Rewrite state ──
  // openRewriteBar: which section has the bar open. bullet-N for bullets.
  const [openRewriteBar, setOpenRewriteBar] = useState<string | null>(null);
  const [rewritingSection, setRewritingSection] = useState<string | null>(null);

  const toggleRewriteBar = (sectionKey: string) => {
    setOpenRewriteBar((prev) => (prev === sectionKey ? null : sectionKey));
  };

  // Undo/Redo hooks for each section
  const titleHistory = useUndoRedo("");
  const descHistory = useUndoRedo("");
  const kwHistory = useUndoRedo("");

  const handleCopy = () => {
    const text = `Title:\n${title}\n\nBullets:\n${bullets.map(b => '• ' + b).join('\n')}\n\nDescription:\n${description}\n\nKeywords:\n${searchTerms}`;
    navigator.clipboard.writeText(text);
    setShowCopyPopup(true);
    setTimeout(() => setShowCopyPopup(false), 2000);
  };

  // Fire onContentChange whenever any field changes
  useEffect(() => {
    if (onContentChange) {
      setTimeout(() => {
        onContentChange({ title, bullets, description, searchTerms });
      }, 0);
    }
  }, [title, bullets, description, searchTerms, onContentChange]);

  // Wrap setters to push to undo history
  const updateTitle = useCallback((val: string) => {
    setTitle(val);
    titleHistory.push(val);
  }, [titleHistory]);

  const updateDescription = useCallback((val: string) => {
    setDescription(val);
    descHistory.push(val);
  }, [descHistory]);

  const updateSearchTerms = useCallback((val: string) => {
    setSearchTerms(val);
    kwHistory.push(val);
  }, [kwHistory]);

  // Reload: fill generic keywords with UNUSED keywords from bank, up to limit
  const handleReloadSearchTerms = useCallback(() => {
    const allKws = Array.from(new Set(
      bankKeywords
        .split(/[\n,]+/)
        .map((k) => stripVolume(k))
        .filter(Boolean)
    ));

    // Content to check against (title + bullets + description, NOT searchTerms)
    const contentText = [title, ...bullets, description].join(" ");

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Find unused keywords
    const unused = allKws.filter(
      (kw) => {
        const regex = new RegExp(`(?<=^|\\W)${escapeRegExp(kw)}(?=$|\\W)`, 'gi');
        return !regex.test(contentText);
      }
    );

    // Build search terms string up to the limit
    const maxLen = limits.searchTerms;
    const parts: string[] = [];
    let currentLen = 0;

    for (const kw of unused) {
      const separator = parts.length > 0 ? "; " : "";
      const needed = separator.length + kw.length;
      if (currentLen + needed > maxLen) break;
      parts.push(kw);
      currentLen += needed;
    }

    const result = parts.join("; ");
    updateSearchTerms(result);
  }, [bankKeywords, title, bullets, description, limits.searchTerms, updateSearchTerms]);

  // Sync local state when new content arrives from API
  const lastSyncedContent = useRef<ContentListing | null>(null);
  useEffect(() => {
    if (content && content !== lastSyncedContent.current) {
      lastSyncedContent.current = content;
      // Strip surrounding quotes that AI sometimes adds
      const strip = (s: string) => s.replace(/^["']+|["']+$/g, "");
      setTimeout(() => {
        setTitle(strip(content.title ?? ""));
        titleHistory.push(strip(content.title ?? ""));
        setBullets(
          content.bullets?.length
            ? content.bullets.map(b => strip(b))
            : ["", "", "", "", ""]
        );
        setDescription(strip(content.description ?? ""));
        descHistory.push(strip(content.description ?? ""));
        setSearchTerms(strip(content.searchTerms ?? ""));
        kwHistory.push(strip(content.searchTerms ?? ""));
      }, 0);
    }
  }, [content, titleHistory, descHistory, kwHistory]);

  const addBullet = () => {
    if (bullets.length < 10) {
      setBullets([...bullets, ""]);
    }
  };

  const removeBullet = () => {
    if (bullets.length > 1) {
      setBullets(bullets.slice(0, -1));
    }
  };

  const updateBullet = (idx: number, val: string) => {
    setBullets((prev) => prev.map((b, i) => (i === idx ? val : b)));
  };

  // ── Per-section rewrite handler (defined after all updaters) ──
  const handleRewrite = useCallback(async (
    section: RewriteRequest["section"],
    currentContent: string,
    instruction: string,
    bulletIndex?: number,
  ) => {
    const sectionKey = section === "bullet" ? `bullet-${bulletIndex}` : section;
    setRewritingSection(sectionKey);

    // Resolve the live char limit for this section from useContentLimits
    const charLimit =
      section === "title" ? limits.title :
      section === "bullet" ? limits.bulletItem :
      limits.description;

    try {
      const apiKey = getStoredApiKey() || "";
      const body: RewriteRequest = {
        section,
        bulletIndex,
        currentContent,
        instruction,
        charLimit,
        model: getStoredModel(),
        context: {
          skillName,
          keywords: bankKeywords,
          otherSections: { title, description },
        },
      };
      const res = await fetch("/content-curator/api/rewrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success && data.rewritten) {
        if (section === "title") updateTitle(data.rewritten);
        else if (section === "description") updateDescription(data.rewritten);
        else if (section === "bullet" && bulletIndex !== undefined) updateBullet(bulletIndex, data.rewritten);
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setRewritingSection(null);
    }
  }, [skillName, bankKeywords, title, description, limits, updateTitle, updateDescription]);

  const keywordsList = useMemo(() => Array.from(new Set(
    bankKeywords
      .split(/[\n,]+/)
      .map((k) => stripVolume(k))
      .filter(Boolean)
  )), [bankKeywords]);

  return (
    <div className="flex flex-col p-6 md:p-8">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between relative">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Content Canvas</h1>
        <div className="flex items-center gap-3">
          {content && !isGenerating && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#fed7aa] px-2.5 py-0.5 font-semibold text-[#b45309] text-[11px] tracking-wide mr-2">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              AI OPTIMIZED
            </div>
          )}
          {isGenerating && (
            <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 font-bold text-zinc-500 dark:text-zinc-400 text-xs tracking-wide mr-2">
              <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
              GENERATING…
            </div>
          )}
          <button onClick={handleCopy} className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-[13px] font-medium">
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            Copy All
          </button>
          <button className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-[13px] font-medium">
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export
          </button>

          {/* Copy Popup */}
          {showCopyPopup && (
            <div className="absolute -top-10 right-14 bg-zinc-800 text-white text-[11px] px-3 py-1.5 rounded-md shadow-lg">
              Copied to clipboard!
              <div className="absolute -bottom-1 right-8 w-2 h-2 bg-zinc-800 rotate-45" />
            </div>
          )}
        </div>
      </div>

      {/* ═══ Product Title ═══ */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="font-semibold text-zinc-800 dark:text-zinc-200 text-[13px]">Product Title</label>
            {!isGenerating && (
              <TextToolbar
                value={title}
                onChange={updateTitle}
                onUndo={titleHistory.undo}
                onRedo={titleHistory.redo}
                canUndo={titleHistory.canUndo()}
                canRedo={titleHistory.canRedo()}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isGenerating && title && (
              <button
                onClick={() => toggleRewriteBar("title")}
                title="Rewrite with AI"
                className={`flex items-center justify-center h-6 w-6 rounded transition-colors ${openRewriteBar === "title" ? "text-[#EA580C]" : "text-zinc-400 hover:text-[#EA580C]"}`}
              >
                <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
              </button>
            )}
            {!isGenerating && <Counter current={title.length} max={limits.title} />}
          </div>
        </div>
        {isGenerating ? (
          <div className="space-y-2 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 px-4 py-3.5">
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-3/4" />
          </div>
        ) : (
          <HighlightTextarea
            value={title}
            onChange={(val) => updateTitle(val)}
            keywords={keywordsList}
            className={`w-full rounded-lg bg-zinc-100/80 dark:bg-zinc-900/80 border border-transparent focus-within:border-[#EA580C] focus-within:ring-1 focus-within:ring-[#EA580C] ${title.length > limits.title ? "border-red-400 ring-1 ring-red-400 focus-within:ring-red-400 focus-within:border-red-400 text-red-600 dark:text-red-400" : ""}`}
            textClassName="text-[14px] font-medium text-zinc-800 dark:text-zinc-200"
            paddingClassName="px-3.5 py-3"
            placeholder="Product title will appear here…"
            minHeight="84px"
          />
        )}
        <RewriteBar
          open={openRewriteBar === "title"}
          isRewriting={rewritingSection === "title"}
          onRegen={(instruction) => handleRewrite("title", title, instruction)}
        />
      </div>

      {/* ═══ Feature Bullets ═══ */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <label className="font-semibold text-zinc-800 dark:text-zinc-200 text-[13px]">
            Feature Bullets ({bullets.length}/10)
          </label>
        </div>

        <div className="space-y-3">
          {isGenerating ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 rounded-lg bg-white dark:bg-zinc-900/50 ring-1 ring-zinc-200/60 dark:ring-zinc-800 p-3 items-start">
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <div className="flex-1 space-y-2">
                  <SkeletonLine className="h-3 w-full" />
                  <SkeletonLine className="h-3 w-4/5" />
                </div>
              </div>
            ))
          ) : (
            bullets.map((bullet, idx) => {
              const over = bullet.length > limits.bulletItem;
              const bulletKey = `bullet-${idx}`;
              return (
                <BulletItem
                  key={idx}
                  idx={idx}
                  bullet={bullet}
                  over={over}
                  max={limits.bulletItem}
                  onChange={(val) => updateBullet(idx, val)}
                  keywords={keywordsList}
                  openRewriteBar={openRewriteBar === bulletKey}
                  onToggleRewriteBar={() => toggleRewriteBar(bulletKey)}
                  isRewriting={rewritingSection === bulletKey}
                  onRegen={(instruction) => handleRewrite("bullet", bullet, instruction, idx)}
                />
              );
            })
          )}
        </div>

        {!isGenerating && (
          <div className="mt-3 flex items-center gap-1">
            <button
              onClick={removeBullet}
              disabled={bullets.length <= 1}
              className="flex h-7 w-7 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300 active:bg-zinc-400 dark:active:bg-zinc-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm font-bold">remove</span>
            </button>
            <button
              onClick={addBullet}
              disabled={bullets.length >= 10}
              className="flex h-7 w-7 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300 active:bg-zinc-400 dark:active:bg-zinc-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
            </button>
          </div>
        )}
      </div>

      {/* ═══ Product Description ═══ */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="font-semibold text-zinc-800 dark:text-zinc-200 text-[13px]">Product Description</label>
            {!isGenerating && (
              <TextToolbar
                value={description}
                onChange={updateDescription}
                onUndo={descHistory.undo}
                onRedo={descHistory.redo}
                canUndo={descHistory.canUndo()}
                canRedo={descHistory.canRedo()}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isGenerating && description && (
              <button
                onClick={() => toggleRewriteBar("description")}
                title="Rewrite with AI"
                className={`flex items-center justify-center h-6 w-6 rounded transition-colors ${openRewriteBar === "description" ? "text-[#EA580C]" : "text-zinc-400 hover:text-[#EA580C]"}`}
              >
                <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
              </button>
            )}
            {!isGenerating && <Counter current={description.length} max={limits.description} />}
          </div>
        </div>
        {isGenerating ? (
          <div className="space-y-2 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 p-4 min-h-[160px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonLine key={i} className={`h-3 ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
            ))}
          </div>
        ) : (
          <HighlightTextarea
            value={description}
            onChange={(val) => updateDescription(val)}
            keywords={keywordsList}
            className={`w-full rounded-lg bg-zinc-100/80 dark:bg-zinc-900/80 border border-transparent focus-within:border-[#EA580C] focus-within:ring-1 focus-within:ring-[#EA580C] ${description.length > limits.description ? "border-red-400 ring-1 ring-red-400 focus-within:ring-red-400 focus-within:border-red-400 text-red-600 dark:text-red-400" : ""}`}
            textClassName="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed"
            paddingClassName="p-3.5"
            placeholder="Product description will appear here…"
            minHeight="160px"
          />
        )}
        <RewriteBar
          open={openRewriteBar === "description"}
          isRewriting={rewritingSection === "description"}
          onRegen={(instruction) => handleRewrite("description", description, instruction)}
        />
      </div>

      {/* ═══ Generic Search Keywords ═══ */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-zinc-800 dark:text-zinc-200 text-[13px]">Generic Search Keywords</label>
            <button
              onClick={handleReloadSearchTerms}
              title="Fill with unused keywords from bank"
              className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-[#EA580C] dark:hover:text-[#EA580C] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
            </button>
            {!isGenerating && (
              <TextToolbar
                value={searchTerms}
                onChange={updateSearchTerms}
                onUndo={kwHistory.undo}
                onRedo={kwHistory.redo}
                canUndo={kwHistory.canUndo()}
                canRedo={kwHistory.canRedo()}
              />
            )}
          </div>
          {!isGenerating && <Counter current={searchTerms.length} max={limits.searchTerms} />}
        </div>
        {isGenerating ? (
          <div className="rounded-lg bg-zinc-200/60 dark:bg-zinc-800/60 p-3.5 min-h-[40px]">
            <SkeletonLine className="h-3 w-full" />
          </div>
        ) : (
          <input
            type="text"
            value={searchTerms}
            onChange={(e) => updateSearchTerms(e.target.value)}
            className={`w-full rounded-lg bg-zinc-200/60 dark:bg-zinc-900/60 p-3 text-[13px] text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 ${searchTerms.length > limits.searchTerms ? "ring-1 ring-red-400 focus:ring-red-400 text-red-600 dark:text-red-400" : "focus:ring-[#EA580C]"}`}
            spellCheck={false}
            placeholder="space-separated search terms…"
          />
        )}
      </div>

    </div>
  );
}

/**
 * Individual Bullet item with its own TextToolbar, undo/redo, and RewriteBar.
 * Extracted as a separate component so each bullet gets its own history.
 */
function BulletItem({
  idx,
  bullet,
  over,
  max,
  onChange,
  keywords,
  openRewriteBar,
  onToggleRewriteBar,
  isRewriting,
  onRegen,
}: {
  idx: number;
  bullet: string;
  over: boolean;
  max: number;
  onChange: (val: string) => void;
  keywords: string[];
  openRewriteBar: boolean;
  onToggleRewriteBar: () => void;
  isRewriting: boolean;
  onRegen: (instruction: string) => void;
}) {
  const history = useUndoRedo(bullet);

  const handleChange = (val: string) => {
    onChange(val);
    history.push(val);
  };

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">#{idx + 1}</span>
          <TextToolbar
            value={bullet}
            onChange={handleChange}
            onUndo={history.undo}
            onRedo={history.redo}
            canUndo={history.canUndo()}
            canRedo={history.canRedo()}
          />
        </div>
        <div className="flex items-center gap-2">
          {bullet && (
            <button
              onClick={onToggleRewriteBar}
              title="Rewrite with AI"
              className={`flex items-center justify-center h-5 w-5 rounded transition-colors ${openRewriteBar ? "text-[#EA580C]" : "text-zinc-400 hover:text-[#EA580C]"}`}
            >
              <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
            </button>
          )}
          <Counter current={bullet.length} max={max} />
        </div>
      </div>
      <div
        className={`rounded-lg bg-white dark:bg-zinc-900/50 ring-1 p-1 pl-3 overflow-hidden ${over ? "ring-red-300" : "ring-zinc-200/60 dark:ring-zinc-800 focus-within:ring-[#EA580C] focus-within:ring-2"}`}
      >
        <div className="flex gap-4 items-start">
          <div className="mt-3.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9a5015]" />
          <HighlightTextarea
            value={bullet}
            onChange={(val) => handleChange(val)}
            keywords={keywords}
            className="w-full bg-transparent border-none ring-0 focus-within:ring-0"
            textClassName="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed placeholder:text-zinc-400"
            paddingClassName="py-2.5 pr-3"
            placeholder={`Bullet point ${idx + 1}…`}
            minHeight="48px"
          />
        </div>
      </div>
      <RewriteBar
        open={openRewriteBar}
        isRewriting={isRewriting}
        onRegen={onRegen}
      />
    </div>
  );
}
