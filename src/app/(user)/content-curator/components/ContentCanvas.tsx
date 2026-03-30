"use client";

import { useState, useEffect } from "react";
import { CONTENT_LIMITS, type ContentListing } from "../lib/types";

interface ContentCanvasProps {
  content: ContentListing | null;
  isGenerating: boolean;
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-zinc-200 ${className}`} />
  );
}

export default function ContentCanvas({ content, isGenerating }: ContentCanvasProps) {
  const [title, setTitle] = useState("");
  const [bullets, setBullets] = useState<string[]>(["", "", "", "", ""]);
  const [description, setDescription] = useState("");
  const [searchTerms, setSearchTerms] = useState("");

  // Sync local state when new content arrives
  useEffect(() => {
    if (content) {
      setTimeout(() => {
        setTitle(content.title ?? "");
        setBullets(
          content.bullets?.length
            ? content.bullets
            : ["", "", "", "", ""]
        );
        setDescription(content.description ?? "");
        setSearchTerms(content.searchTerms ?? "");
      }, 0);
    }
  }, [content]);

  const addBullet = () => {
    if (bullets.length < CONTENT_LIMITS.bulletMax) {
      setBullets([...bullets, ""]);
    }
  };

  const removeBullet = () => {
    if (bullets.length > CONTENT_LIMITS.bulletMin) {
      setBullets(bullets.slice(0, -1));
    }
  };

  const updateBullet = (idx: number, val: string) => {
    setBullets((prev) => prev.map((b, i) => (i === idx ? val : b)));
  };

  // Empty state
  if (!content && !isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-white p-8 shadow-sm ring-1 ring-zinc-200 min-h-[500px] text-center">
        <span className="material-symbols-outlined mb-4 text-5xl text-zinc-300">edit_document</span>
        <p className="text-base font-semibold text-zinc-400">No content yet</p>
        <p className="mt-1 text-sm text-zinc-400">
          Add keywords, choose a skill profile, then hit <strong>Create</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl bg-white p-6 md:p-8 shadow-sm ring-1 ring-zinc-200">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Content Canvas</h1>
        {content && !isGenerating && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#fed7aa] px-2.5 py-0.5 font-semibold text-[#b45309] text-[11px] tracking-wide">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            AI OPTIMIZED
          </div>
        )}
        {isGenerating && (
          <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 font-bold text-zinc-500 text-xs tracking-wide">
            <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
            GENERATING…
          </div>
        )}
      </div>

      {/* Product Title */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <label className="font-semibold text-zinc-800 text-[13px]">Product Title</label>
          <span className="text-xs text-zinc-400">
            {isGenerating ? "—" : `${title.length} / ${CONTENT_LIMITS.title}`}
          </span>
        </div>
        {isGenerating ? (
          <div className="space-y-2 rounded-lg bg-zinc-100/80 px-4 py-3.5">
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-3/4" />
          </div>
        ) : (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={CONTENT_LIMITS.title}
            className="w-full rounded-lg bg-zinc-100/80 px-3.5 py-3 text-[14px] font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
            placeholder="Product title will appear here…"
          />
        )}
      </div>

      {/* Feature Bullets */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <label className="font-semibold text-zinc-800 text-[13px]">
            Feature Bullets ({bullets.length}/{CONTENT_LIMITS.bulletMax})
          </label>
          {!isGenerating && (
            <div className="flex items-center gap-1">
              <button
                onClick={removeBullet}
                disabled={bullets.length <= CONTENT_LIMITS.bulletMin}
                className="flex h-7 w-7 items-center justify-center rounded bg-zinc-200 text-zinc-500 hover:bg-zinc-300 hover:text-zinc-700 active:bg-zinc-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm font-bold">remove</span>
              </button>
              <button
                onClick={addBullet}
                disabled={bullets.length >= CONTENT_LIMITS.bulletMax}
                className="flex h-7 w-7 items-center justify-center rounded bg-zinc-200 text-zinc-500 hover:bg-zinc-300 hover:text-zinc-700 active:bg-zinc-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm font-bold">add</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {isGenerating ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 rounded-lg bg-white ring-1 ring-zinc-200/60 p-3 items-start">
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                <div className="flex-1 space-y-2">
                  <SkeletonLine className="h-3 w-full" />
                  <SkeletonLine className="h-3 w-4/5" />
                </div>
              </div>
            ))
          ) : (
            bullets.map((bullet, idx) => (
              <div
                key={idx}
                className="flex gap-4 rounded-lg bg-white ring-1 ring-zinc-200/60 p-1 pl-3 focus-within:ring-[#EA580C] focus-within:ring-2 overflow-hidden items-start"
              >
                <div className="mt-3.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9a5015]" />
                <textarea
                  value={bullet}
                  onChange={(e) => updateBullet(idx, e.target.value)}
                  className="w-full min-h-[48px] resize-none bg-transparent py-2.5 pr-3 text-[13px] text-zinc-700 placeholder:text-zinc-400 focus:outline-none leading-relaxed"
                  rows={2}
                  spellCheck={false}
                  placeholder={`Bullet point ${idx + 1}…`}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Product Description */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <label className="font-semibold text-zinc-800 text-[13px]">Product Description</label>
          <span className="text-xs text-zinc-400">
            {isGenerating ? "—" : `${description.length} / ${CONTENT_LIMITS.description}`}
          </span>
        </div>
        {isGenerating ? (
          <div className="space-y-2 rounded-lg bg-zinc-100/80 p-4 min-h-[160px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonLine key={i} className={`h-3 ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
            ))}
          </div>
        ) : (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={CONTENT_LIMITS.description}
            className="w-full min-h-[160px] resize-none rounded-lg bg-zinc-100/80 p-3.5 text-[13px] text-zinc-700 leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
            spellCheck={false}
            placeholder="Product description will appear here…"
          />
        )}
      </div>

      {/* Generic Search Keywords */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="font-semibold text-zinc-800 text-[13px]">Generic Search Keywords</label>
          <span className="text-xs text-zinc-400">
            {isGenerating ? "—" : `${searchTerms.length} / ${CONTENT_LIMITS.searchTerms}`}
          </span>
        </div>
        {isGenerating ? (
          <div className="rounded-lg bg-zinc-200/60 p-3.5 min-h-[60px]">
            <SkeletonLine className="h-3 w-full" />
          </div>
        ) : (
          <textarea
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
            maxLength={CONTENT_LIMITS.searchTerms}
            className="w-full min-h-[60px] resize-none rounded-lg bg-zinc-200/60 p-3 text-[13px] text-zinc-700 focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
            spellCheck={false}
            placeholder="space-separated search terms…"
          />
        )}
      </div>

    </div>
  );
}
