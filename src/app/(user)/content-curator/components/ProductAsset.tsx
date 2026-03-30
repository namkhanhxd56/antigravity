export default function ProductAsset() {
  return (
    <div className="flex flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#EA580C]">image</span>
        <h2 className="text-lg font-bold text-zinc-900">Product Asset</h2>
      </div>
      
      {/* Image Placeholder */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200/50 flex items-center justify-center">
        {/* We use a gradient and some shapes to simulate the premium 3D pod from the mockup */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-700 to-slate-900" />
        
        {/* Mocking the uploaded image */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-end gap-1">
            <div className="h-32 w-16 rounded-t-full bg-slate-300 shadow-xl" />
            <div className="h-40 w-20 rounded-t-full bg-slate-200 shadow-xl" />
          </div>
          <div className="h-4 w-40 rounded-full bg-slate-400 mt-2 shadow-2xl" />
        </div>
        
        <div className="absolute inset-0 border-[8px] border-dashed border-zinc-900/10 pointer-events-none" />
      </div>
    </div>
  );
}
