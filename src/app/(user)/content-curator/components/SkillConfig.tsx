import { useState, useRef } from "react";
import { SKILL_OPTIONS, type SkillOption } from "../lib/types";
import CustomizationContent from "./CustomizationContent";

interface SkillConfigProps {
  selectedSkill: SkillOption;
  onSkillChange: (skill: SkillOption) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
}

export default function SkillConfig({
  selectedSkill,
  onSkillChange,
  onGenerate,
  isGenerating,
  canGenerate,
}: SkillConfigProps) {
  const [occasion, setOccasion] = useState<string>("Holiday Q4");
  const [notes, setNotes] = useState<string>("Target: remote workers. Emphasize premium materials & minimalist design.");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      await fetch('/api/upload-skill', {
        method: 'POST',
        body: formData
      });
      alert(`Imported ${file.name} successfully!`);
    } catch {
      console.error("Upload failed");
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
      
      {/* Skill Dropdown & Import */}
      <div className="mb-6 space-y-3">
        <label className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
          SKILL
        </label>
        <div className="relative">
          <select
            value={selectedSkill}
            onChange={(e) => onSkillChange(e.target.value as SkillOption)}
            className="w-full appearance-none rounded-lg border border-zinc-200 bg-zinc-50 py-2.5 pl-4 pr-10 text-[13px] font-medium text-zinc-700 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
          >
            {SKILL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="material-symbols-outlined text-zinc-400 text-lg">expand_more</span>
          </div>
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
          className="w-full rounded-lg border border-dashed border-zinc-300 py-2 text-[13px] font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
          Import .md skill file
        </button>
      </div>

      <hr className="mb-6 border-zinc-100" />

      {/* Customization (placeholder component) */}
      <CustomizationContent 
        occasion={occasion}
        setOccasion={setOccasion}
        notes={notes}
        setNotes={setNotes}
      />

      <hr className="mb-6 border-zinc-100 mt-2" />

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
    </div>
  );
}
