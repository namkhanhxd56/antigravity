'use client';

import { useRef } from 'react';

export default function ProductAsset() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#EA580C]">image</span>
        <h2 className="text-lg font-bold text-zinc-900">Product Asset</h2>
      </div>
      
      {/* Upload Zone */}
      <div className="relative flex aspect-square w-full flex-col items-center justify-center rounded-xl border-[3px] border-dashed border-slate-200 bg-white p-6 text-center transition-colors hover:border-slate-300">
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/png, image/jpeg" 
        />
        
        {/* Icon Circle */}
        <div className="mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#EDF2FE] text-[#2563EB]">
          <span className="material-symbols-outlined text-[32px]">upload_file</span>
        </div>
        
        {/* Text */}
        <h3 className="mb-2 text-[19px] font-bold tracking-tight text-slate-900">
          Drop, browse, or paste
        </h3>
        <p className="mb-7 text-[15px] font-medium text-slate-500 tracking-wide">
          PNG, JPG up to 10MB &middot; <span className="font-bold text-[#2563EB]">Ctrl+V</span> to paste
        </p>

        {/* Button */}
        <button 
          onClick={handleBrowseClick}
          className="rounded-xl bg-[#111827] px-8 py-3.5 text-[15px] font-bold tracking-wide text-white shadow-sm transition-all hover:bg-black active:scale-[0.98]"
        >
          Browse Files
        </button>
      </div>
    </div>
  );
}
