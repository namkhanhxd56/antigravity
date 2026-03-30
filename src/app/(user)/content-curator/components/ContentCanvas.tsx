'use client';

import { useState } from 'react';

const INITIAL_BULLETS = [
  "Crafted from sustainable solid oak and aerospace-grade aluminum for lifetime durability.",
  "Advanced ergonomic pivot system allowing for 360-degree rotation and height adjustment.",
  "Integrated cable management system hidden within the central spine for a clean aesthetic.",
  "Non-slip silicone padding protects your desktop surface from scratches and vibration.",
  "Quick-snap assembly takes less than 5 minutes with no extra tools required."
];

export default function ContentCanvas() {
  const [bullets, setBullets] = useState(INITIAL_BULLETS);

  const addBullet = () => {
    if (bullets.length < 10) setBullets([...bullets, ""]);
  };

  const removeBullet = () => {
    if (bullets.length > 5) setBullets(bullets.slice(0, -1));
  };

  return (
    <div className="flex flex-col rounded-xl bg-white p-6 md:p-8 shadow-sm ring-1 ring-zinc-200">
      
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-black text-zinc-900">Content Canvas</h1>
        <div className="flex items-center gap-1.5 rounded-full bg-[#fed7aa] px-3 py-1 font-bold text-[#b45309] text-xs tracking-wide">
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          AI OPTIMIZED
        </div>
      </div>

      {/* Product Title */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <label className="font-bold text-zinc-900 text-sm">Product Title</label>
          <span className="text-xs text-zinc-400">142 / 200</span>
        </div>
        <input 
          type="text"
          defaultValue="Premium Ergonomic Workspace Solution – Polished Aluminum & Solid Oak Monitor Stand, Adjustable Height, Built-in Cable Routing, Holds up to 40lbs, Modern Desk Organizer, Matte Silver"
          className="w-full rounded-lg bg-zinc-100/80 px-4 py-3.5 text-base font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
        />
      </div>

      {/* Feature Bullets */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <label className="font-bold text-zinc-900 text-sm">
            Feature Bullets ({bullets.length}/10)
          </label>
          <div className="flex items-center gap-1">
            <button 
              onClick={removeBullet}
              className="flex h-7 w-7 items-center justify-center rounded bg-zinc-200 text-zinc-500 hover:bg-zinc-300 hover:text-zinc-700 active:bg-zinc-400 transition-colors disabled:opacity-50"
              disabled={bullets.length <= 5}
            >
              <span className="material-symbols-outlined text-sm font-bold">remove</span>
            </button>
            <button 
              onClick={addBullet}
              className="flex h-7 w-7 items-center justify-center rounded bg-zinc-200 text-zinc-500 hover:bg-zinc-300 hover:text-zinc-700 active:bg-zinc-400 transition-colors disabled:opacity-50"
              disabled={bullets.length >= 10}
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {bullets.map((bullet, idx) => (
            <div key={idx} className="flex gap-4 rounded-lg bg-white ring-1 ring-zinc-200/60 p-1 pl-3 focus-within:ring-[#EA580C] focus-within:ring-2 overflow-hidden items-start">
              <div className="mt-3.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9a5015]" />
              <textarea 
                defaultValue={bullet}
                className="w-full min-h-[48px] resize-none bg-transparent py-2.5 pr-3 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none leading-relaxed"
                rows={2}
                spellCheck={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Product Description */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <label className="font-bold text-zinc-900 text-sm">Product Description</label>
          <span className="text-xs text-zinc-400">412 / 1000</span>
        </div>
        <textarea 
          defaultValue={"Elevate your workspace to professional editorial standards with the AMZ Curator series. This meticulously designed stand combines industrial strength with organic textures to provide a focal point for any modern home office. Every curve is intentional, and every material is selected for its tactile feedback and visual longevity. Whether you are a creator, developer, or digital nomad, this tool bridges the gap between utility and art. Our signature aerospace-grade aluminum skeleton supports dual-monitor setups flawlessly while the solid oak veneer introduces warmth..."}
          className="w-full min-h-[160px] resize-none rounded-lg bg-zinc-100/80 p-4 text-sm text-zinc-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
          spellCheck={false}
        />
      </div>

      {/* Generic Search Keywords */}
      <div>
        <div className="mb-2">
          <label className="font-bold text-zinc-900 text-sm">Generic Search Keywords</label>
        </div>
        <textarea 
          defaultValue="office decor, desk accessories, monitor stand, wooden electronics, ergonomic design, cable management, wfh setup"
          className="w-full min-h-[60px] resize-none rounded-lg bg-zinc-200/60 p-3.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
          spellCheck={false}
        />
      </div>

    </div>
  );
}
