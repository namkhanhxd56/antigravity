export default function SkillConfig() {
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
            className="w-full appearance-none rounded-md border-0 bg-zinc-200/60 py-2.5 pl-4 pr-10 text-sm font-medium text-zinc-700 focus:ring-2 focus:ring-[#EA580C] outline-none transition-shadow"
            defaultValue="Editorial_Pro_V2.md"
          >
            <option value="Editorial_Pro_V2.md">Editorial_Pro_V2.md</option>
            <option value="Standard_SEO_V1.md">Standard_SEO_V1.md</option>
            <option value="Aggressive_Sales.md">Aggressive_Sales.md</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="material-symbols-outlined text-zinc-500 text-sm">expand_more</span>
          </div>
        </div>
      </div>

      <button className="flex w-full items-center justify-center gap-2 rounded-md bg-[#9a5015] py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#864410] active:scale-[0.98]">
        <span className="material-symbols-outlined text-base">auto_awesome</span>
        Create
      </button>
    </div>
  );
}
