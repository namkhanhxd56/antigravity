interface CustomizationContentProps {
  occasion: string;
  setOccasion: (occ: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
}

export default function CustomizationContent({
  occasion,
  setOccasion,
  notes,
  setNotes,
}: CustomizationContentProps) {
  const occasionOptions = ["Everyday", "Holiday Q4", "Prime Day", "Back to school", "Valentine's"];

  return (
    <div className="mb-6">
      <div className="inline-block bg-[#D3E3FD] px-2 py-0.5 rounded-sm mb-4">
        <h3 className="text-[11px] font-bold tracking-wider text-[#1B64F2] uppercase">
          CUSTOMIZATION
        </h3>
      </div>
      
      <div className="mb-5">
        <label className="block text-[13px] font-medium text-zinc-700 mb-2">
          Occasion
        </label>
        <div className="flex flex-wrap gap-2">
          {occasionOptions.map(opt => (
            <button
              key={opt}
              onClick={() => setOccasion(opt)}
              className={`rounded-full border px-3.5 py-1 text-[13px] font-medium transition-colors ${
                occasion === opt 
                  ? "border-[#B45309] bg-[#B45309] text-white shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[13px] font-medium text-zinc-700 mb-2 mt-4">
          Notes
        </label>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-[13px] text-zinc-700 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none min-h-[80px]"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
