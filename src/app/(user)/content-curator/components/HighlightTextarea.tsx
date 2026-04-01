"use client";

import { useMemo, useRef } from "react";

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

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  // Build chunks for highlighting (only finding whole-word matches)
  const chunks = useMemo(() => {
    if (!value) return [];
    if (!keywords || keywords.length === 0) return [{ text: value, match: false }];

    // Sort by length descending to match longest possible keyword first
    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
    const pattern = sortedKeywords.map(escapeRegExp).join('|');
    const regex = new RegExp(`(?<=^|\\W)(${pattern})(?=$|\\W)`, 'gi');

    const result = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(value)) !== null) {
      const matchStart = match.index;
      // Depending on browsers, regex.exec might include empty strings if not careful.
      const matchText = match[1];

      if (matchStart > lastIndex) {
        result.push({ text: value.substring(lastIndex, matchStart), match: false });
      }

      result.push({ text: matchText, match: true });
      lastIndex = matchStart + matchText.length;
    }

    if (lastIndex < value.length) {
      result.push({ text: value.substring(lastIndex), match: false });
    }

    return result;
  }, [value, keywords]);

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
