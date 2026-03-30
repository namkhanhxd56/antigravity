import { SKILL_OPTIONS, type SkillOption } from "../lib/types";

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
  return (
    <div className="flex flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#EA580C]">code_blocks</span>
        <h2 className="text-lg font-bold text-zinc-900">Skill Config</h2>
      </div>

      <div className="mb-6 space-y-2">
        <label className="text-xs font-bold tracking-wider text-zinc-500">
          SELECT .MD PROFILE
        </label>
        <div className="relative">
          <select
            value={selectedSkill}
            onChange={(e) => onSkillChange(e.target.value as SkillOption)}
            className="w-full appearance-none rounded-md border-0 bg-zinc-200/60 py-2.5 pl-4 pr-10 text-sm font-medium text-zinc-700 focus:ring-2 focus:ring-[#EA580C] outline-none transition-shadow"
          >
            {SKILL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="material-symbols-outlined text-zinc-500 text-sm">expand_more</span>
          </div>
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating || !canGenerate}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-[#9a5015] py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#864410] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {isGenerating ? (
          <>
            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
            Generating…
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            Create
          </>
        )}
      </button>
    </div>
  );
}
