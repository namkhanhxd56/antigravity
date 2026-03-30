export default function KeywordBank() {
  return (
    <div className="flex h-full flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#EA580C] rotate-45 transform">key</span>
        <h2 className="text-lg font-bold text-zinc-900">Keyword Bank</h2>
      </div>

      <div className="flex-1">
        <textarea
          className="h-full min-h-[400px] w-full resize-none rounded-lg bg-zinc-200/50 p-4 text-sm text-zinc-700 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#EA580C] transition-shadow"
          placeholder="Enter keywords separated by commas or line breaks..."
          spellCheck={false}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 text-xs font-bold tracking-wider">
        <span className="text-zinc-500">SUGGESTED INTENSITY</span>
        <span className="text-[#EA580C]">HIGH (42)</span>
      </div>
    </div>
  );
}
