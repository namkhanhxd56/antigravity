interface KeywordBankProps {
  value: string;
  onChange: (value: string) => void;
}

export default function KeywordBank({ value, onChange }: KeywordBankProps) {
  const keywordCount = value
    .split(/[\n,]+/)
    .map((k) => k.trim())
    .filter(Boolean).length;

  const intensity =
    keywordCount >= 30 ? "HIGH" :
    keywordCount >= 15 ? "MEDIUM" :
    keywordCount > 0   ? "LOW" : "—";

  const intensityColor =
    keywordCount >= 30 ? "text-[#EA580C]" :
    keywordCount >= 15 ? "text-amber-500" :
    "text-zinc-400";

  return (
    <div className="flex h-full flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#EA580C] rotate-45 transform">key</span>
        <h2 className="text-[15px] font-semibold text-zinc-800">Keyword Bank</h2>
      </div>

      <div className="flex-1">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-full min-h-[400px] w-full resize-none rounded-lg bg-zinc-200/50 p-4 text-sm text-zinc-700 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#EA580C] transition-shadow"
          placeholder="Enter keywords separated by commas or line breaks..."
          spellCheck={false}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 text-[11px] font-semibold tracking-wider">
        <span className="text-zinc-500">SUGGESTED INTENSITY</span>
        <span className={intensityColor}>
          {intensity}{keywordCount > 0 ? ` (${keywordCount})` : ""}
        </span>
      </div>
    </div>
  );
}
