"use client";

import { useState, useRef, useEffect } from "react";
import { DEFAULT_SKILL_OPTIONS, type SkillOption } from "../lib/types";
import CustomizationContent from "./CustomizationContent";
import { splitSkill, saveSplitToStorage, clearSplitStorage } from "../lib/skillSplitter";

const LOCAL_SKILLS_KEY = "curator_local_skills";

/** Lấy map tất cả local skills từ localStorage: { "filename.md": "content..." } */
export function getLocalSkills(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SKILLS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Lấy nội dung của một skill từ localStorage (null nếu không có) */
export function getLocalSkillContent(skillName: string): string | null {
  return getLocalSkills()[skillName] ?? null;
}

interface SkillConfigProps {
  selectedSkill: string;
  onSkillChange: (skill: string) => void;
  enableOccasion: boolean;
  onEnableOccasionChange: (v: boolean) => void;
  occasion: string;
  onOccasionChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
  /** Slot cho Dev Inspector — undefined khi production (file bị gitignore) */
  devPanel?: React.ReactNode;
  /** Called after skill is split — notifies parent of new split state */
  onSkillSplit?: (skillName: string) => void;
  /** Called whenever full skill content is loaded (raw .md string) — for no-split pipeline */
  onSkillContentLoaded?: (content: string) => void;
  /** Whether to show the Generate button (default true). Pass false when button lives in another column. */
  showGenerateButton?: boolean;
}

export default function SkillConfig({
  selectedSkill,
  onSkillChange,
  enableOccasion,
  onEnableOccasionChange,
  occasion,
  onOccasionChange,
  notes,
  onNotesChange,
  onGenerate,
  isGenerating,
  canGenerate,
  devPanel,
  onSkillSplit,
  onSkillContentLoaded,
  showGenerateButton = true,
}: SkillConfigProps) {
  const [isReloading, setIsReloading] = useState(false);
  const [skillOptions, setSkillOptions] = useState<SkillOption[]>(DEFAULT_SKILL_OPTIONS);
  const [splitStatus, setSplitStatus] = useState<"none" | "ok" | "missing">("none");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Merge server skills với local skills từ localStorage */
  const buildSkillOptions = (serverSkills: SkillOption[]): SkillOption[] => {
    const localKeys = Object.keys(getLocalSkills());
    const localOptions: SkillOption[] = localKeys
      .filter((k) => !serverSkills.find((s) => s.value === k))
      .map((k) => ({
        value: k,
        label: k.replace(/\.md$/, "").replace(/_/g, " "),
      }));
    return [...serverSkills, ...localOptions];
  };

  const fetchSkills = async () => {
    try {
      const res = await fetch('/content-curator/api/skills');
      const data = await res.json();
      const serverSkills: SkillOption[] = data.skills?.length ? data.skills : DEFAULT_SKILL_OPTIONS;
      setSkillOptions(buildSkillOptions(serverSkills));
    } catch {
      setSkillOptions(buildSkillOptions(DEFAULT_SKILL_OPTIONS));
    }
  };

  useEffect(() => {
    fetchSkills();
    fetchAndSplitSkill(selectedSkill);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Fetch content từ localStorage hoặc server, rồi split */
  const fetchAndSplitSkill = async (skillName: string) => {
    // 1. Thử localStorage trước (user-imported skills)
    const localContent = getLocalSkillContent(skillName);
    if (localContent) {
      triggerSplit(skillName, localContent);
      return;
    }
    // 2. Fallback: đọc từ server (built-in skills trên disk)
    try {
      const res = await fetch(`/content-curator/api/skill-content?name=${encodeURIComponent(skillName)}`);
      const data = await res.json();
      if (data.success && data.content) {
        triggerSplit(skillName, data.content);
      } else {
        clearSplitStorage();
        setSplitStatus("none");
      }
    } catch {
      clearSplitStorage();
      setSplitStatus("none");
    }
  };

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await fetchAndSplitSkill(selectedSkill);
    } finally {
      setIsReloading(false);
    }
  };

  const handleSkillChange = async (skillName: string) => {
    onSkillChange(skillName);
    await fetchAndSplitSkill(skillName);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  /** Tách skill file thành 3 sections và lưu vào localStorage + disk (local only) */
  const triggerSplit = (skillName: string, content: string) => {
    const result = splitSkill(content);
    saveSplitToStorage(skillName, result);
    setSplitStatus(result.isValid ? "ok" : "missing");
    onSkillSplit?.(skillName);
    onSkillContentLoaded?.(content);

    // Write split sections to disk for local inspection only (no-op on Vercel)
    if (process.env.NODE_ENV === "development") {
      fetch("/content-curator/api/save-skill-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillName,
          image: result.image,
          title: result.title,
          bullets: result.bullets,
          description: result.description,
        }),
      }).catch(() => {/* silently ignore */});
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Đọc file content ngay trên browser — không upload lên server
      // (Vercel filesystem là read-only nên upload sẽ thất bại)
      const content = await file.text();
      const localSkills = getLocalSkills();
      localSkills[file.name] = content;
      localStorage.setItem(LOCAL_SKILLS_KEY, JSON.stringify(localSkills));

      // Tách skill thành 3 sections cho pipeline
      triggerSplit(file.name, content);

      // Cập nhật dropdown + chọn skill vừa import
      await fetchSkills();
      onSkillChange(file.name);
    } catch {
      console.error("Import failed");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col p-6">
      
      {/* Skill Dropdown & Import */}
      <div className="mb-6 space-y-3">
        <label className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
          SKILL
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <select
              value={selectedSkill}
              onChange={(e) => handleSkillChange(e.target.value)}
              className="w-full appearance-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 py-2.5 pl-4 pr-10 text-[13px] font-medium text-zinc-700 dark:text-zinc-200 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
            >
              {skillOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500 text-lg">expand_more</span>
            </div>
          </div>
          <button
            onClick={handleReload}
            disabled={isReloading}
            title="Reload skill from disk (clears cache)"
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[18px] ${isReloading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".md"
          onChange={handleFileChange} 
        />
        <button
          onClick={handleImportClick}
          className="w-full rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 py-2 text-[13px] font-medium text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
          Import .md skill file
        </button>

        {/* Split status indicator */}
        {splitStatus !== "none" && (
          <div className={`flex items-center gap-1.5 text-[11px] font-medium ${splitStatus === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
            <span className="material-symbols-outlined text-[14px]">
              {splitStatus === "ok" ? "check_circle" : "warning"}
            </span>
            {splitStatus === "ok"
              ? "Skill split: TITLE / BULLETS / DESCRIPTION ✓"
              : "Skill missing ## TITLE / ## BULLETS / ## DESCRIPTION sections"}
          </div>
        )}
      </div>

      <hr className="mb-6 border-zinc-100 dark:border-zinc-800" />

      {/* Customization */}
      <CustomizationContent
        enableOccasion={enableOccasion}
        setEnableOccasion={onEnableOccasionChange}
        occasion={occasion}
        setOccasion={onOccasionChange}
      />

      <hr className="mb-6 border-zinc-100 dark:border-zinc-800 mt-2" />

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase mb-2">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full resize-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-3 text-[13px] text-zinc-700 dark:text-zinc-200 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none min-h-[80px]"
          spellCheck={false}
          placeholder="Additional context or formatting notes..."
        />
      </div>

      <hr className="mb-6 border-zinc-100 dark:border-zinc-800" />

      {/* Generate Button */}
      {showGenerateButton && (
        <button
          onClick={onGenerate}
          disabled={isGenerating || !canGenerate}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#B45309] py-3 text-[15px] font-medium text-white shadow-sm transition-all hover:bg-[#92400e] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isGenerating ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              Generating…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              Generate content
            </>
          )}
        </button>
      )}

      {/* Dev Inspector slot — chỉ có khi file DevInspector.tsx tồn tại (dev only) */}
      {devPanel}

    </div>
  );
}
