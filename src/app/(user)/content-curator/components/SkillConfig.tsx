"use client";

import { useState, useRef, useEffect } from "react";
import { DEFAULT_SKILL_OPTIONS, type SkillOption } from "../lib/types";
import CustomizationContent from "./CustomizationContent";

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
}: SkillConfigProps) {
  const [isReloading, setIsReloading] = useState(false);
  const [skillOptions, setSkillOptions] = useState<SkillOption[]>(DEFAULT_SKILL_OPTIONS);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSkills = async () => {
    try {
      const res = await fetch('/content-curator/api/skills');
      const data = await res.json();
      if (data.skills?.length) {
        setSkillOptions(data.skills);
      }
    } catch {
      // keep defaults
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await fetch('/content-curator/api/reload-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName: selectedSkill }),
      });
    } finally {
      setIsReloading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch('/content-curator/api/upload-skill', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        await fetchSkills();
        onSkillChange(file.name);
      }
    } catch {
      console.error("Upload failed");
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
              onChange={(e) => onSkillChange(e.target.value)}
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

      {/* Dev Inspector slot — chỉ có khi file DevInspector.tsx tồn tại (dev only) */}
      {devPanel}

    </div>
  );
}
