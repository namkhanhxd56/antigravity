import { useState } from "react";
import { OCCASIONS } from "../lib/types";

interface CustomizationContentProps {
  enableOccasion: boolean;
  setEnableOccasion: (v: boolean) => void;
  occasion: string;
  setOccasion: (occ: string) => void;
}

export default function CustomizationContent({
  enableOccasion,
  setEnableOccasion,
  occasion,
  setOccasion,
}: CustomizationContentProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md bg-[#D3E3FD] dark:bg-blue-900/30 px-3 py-1.5 transition-colors hover:bg-blue-200 dark:hover:bg-blue-900/50"
      >
        <span className="text-[11px] font-bold tracking-wider text-[#1B64F2] dark:text-blue-400 uppercase">
          CUSTOMIZATION (OPTIONAL)
        </span>
        <span className="material-symbols-outlined text-[#1B64F2] dark:text-blue-400 text-[18px]">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
      
      <div className="mb-5">
        <label className="flex items-center gap-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 mb-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={enableOccasion}
            onChange={(e) => setEnableOccasion(e.target.checked)}
            className="rounded border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-[#B45309] dark:text-[#EA580C] focus:ring-[#B45309] dark:focus:ring-[#EA580C]"
          />
          Enable Occasion
        </label>
        
        {enableOccasion && (
          <div className="flex flex-wrap gap-2 pl-6 animate-in fade-in">
          {OCCASIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setOccasion(opt)}
              className={`rounded-full border px-3.5 py-1 text-[13px] font-medium transition-colors ${
                occasion === opt 
                  ? "border-[#B45309] dark:border-[#EA580C] bg-[#B45309] dark:bg-[#EA580C] text-white shadow-sm"
                  : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              }`}
            >
              {opt}
            </button>
          ))}
          </div>
        )}
      </div>

        </div>
      )}
    </div>
  );
}
