"use client";

import { useMemo, useRef } from "react";
import { chunkByKeywords } from "../lib/keywordPool";

interface HighlightTextareaProps {
  value: string;
  onChange: (value: string) => void;
  keywords: string[];
  placeholder?: string;
  className?: string;
  textClassName?: string;
  paddingClassName?: string;
  minHeight?: string;
}

export default function HighlightTextarea({
  value,
  onChange,
  keywords,
  placeholder,
  className = "",
  textClassName = "text-[13px]",
  paddingClassName = "p-4",
  minHeight = "100px",
}: HighlightTextareaProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const chunks = useMemo(() => chunkByKeywords(value, keywords), [value, keywords]);

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ minHeight }}>
      {/* Backdrop for highlights */}
      <div 
        ref={backdropRef}
        className={`absolute inset-0 ${paddingClassName} ${textClassName} whitespace-pre-wrap break-words pointer-events-none overflow-hidden`}
        aria-hidden="true"
      >
        {chunks.map((chunk, i) =>
          chunk.match ? (
            <span key={i} className="text-[#EA580C]">
              {chunk.text}
            </span>
          ) : (
            <span key={i}>{chunk.text}</span>
          )
        )}
        {/* Adds trailing space height fix if text ends with a newline */}
        {value.endsWith("\n") && <br />}
      </div>

      {/* Actual Textarea (Transparent text but visible caret & placeholder) */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        spellCheck={false}
        className={`relative z-10 w-full h-full resize-none bg-transparent ${paddingClassName} ${textClassName} outline-none m-0 block !text-transparent caret-zinc-900 dark:caret-zinc-100 placeholder:text-zinc-400`}
        style={{ minHeight }}
      />
    </div>
  );
}
