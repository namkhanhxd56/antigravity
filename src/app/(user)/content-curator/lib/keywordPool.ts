/**
 * KeywordPool — thuật toán quản lý keyword giữa các bước pipeline.
 * Chạy hoàn toàn trên client-side (không cần API).
 */

export interface KeywordPool {
  /** Keywords được user assign cho từng section */
  assigned: {
    title: string[];
    bullets: string[];
    description: string[];
  };
  /** Keywords chưa được assign, hoặc đã được trả lại sau khi step không dùng */
  available_pool: string[];
  /** Keywords đã được dùng (xác nhận bằng scan output) */
  used: {
    title: string[];
    bullets: string[];
    description: string[];
  };
}

/** Escape các ký tự đặc biệt của RegExp để dùng safely trong pattern */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Tạo regex để khớp 1 keyword theo whole-word match (case insensitive).
 * Dùng lookbehind/lookahead để không tiêu thụ boundary char — đảm bảo
 * count chính xác khi keyword xuất hiện nhiều lần liền kề.
 *
 * Dùng làm matcher chung cho:
 *   - scanUsed (tồn tại) — pipeline pool tracking
 *   - computeCounts (đếm) — UI counter
 *   - handleReloadSearchTerms (tồn tại) — generic search reload
 *
 * Default flag "gi" cho đếm; truyền "i" nếu chỉ cần check tồn tại.
 */
export function buildKeywordRegex(kw: string, flags: string = "gi"): RegExp {
  return new RegExp(`(?<=^|\\W)${escapeRegex(kw)}(?=$|\\W)`, flags);
}

/** Một đoạn text trong chunked output — `match: true` nghĩa là trùng keyword */
export interface TextChunk {
  text: string;
  match: boolean;
}

/**
 * Cắt text thành các đoạn {text, match} để render highlight.
 * Multi-keyword alternation — sort theo độ dài giảm dần để ưu tiên match
 * cụm dài trước (ví dụ "vinyl sticker" trước "sticker").
 * Cùng semantics whole-word match với buildKeywordRegex.
 *
 * Dùng bởi: HighlightTextarea (editable), CompareView's HighlightText (read-only).
 */
export function chunkByKeywords(text: string, keywords: string[]): TextChunk[] {
  if (!text) return [];
  if (!keywords.length) return [{ text, match: false }];

  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  const pattern = sorted.map(escapeRegex).join("|");
  const regex = new RegExp(`(?<=^|\\W)(${pattern})(?=$|\\W)`, "gi");

  const result: TextChunk[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      result.push({ text: text.slice(lastIndex, m.index), match: false });
    }
    result.push({ text: m[1], match: true });
    lastIndex = m.index + m[1].length;
  }
  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), match: false });
  }
  return result;
}

/**
 * Khởi tạo KeywordPool từ keyword array đã parse + user assignments.
 * Keywords đã assigned vào section sẽ không có trong available_pool.
 */
export function initPool(
  allKeywords: string[],
  assignments: { title: string[]; bullets: string[]; description: string[] }
): KeywordPool {
  const assignedSet = new Set([
    ...assignments.title,
    ...assignments.bullets,
    ...assignments.description,
  ].map((k) => k.toLowerCase()));

  const available_pool = allKeywords.filter((kw) => !assignedSet.has(kw.toLowerCase()));

  return {
    assigned: {
      title: [...assignments.title],
      bullets: [...assignments.bullets],
      description: [...assignments.description],
    },
    available_pool,
    used: { title: [], bullets: [], description: [] },
  };
}

/**
 * Scan text output và xác định keyword nào đã xuất hiện.
 * Dùng whole-word match (case insensitive) qua buildKeywordRegex.
 */
export function scanUsed(text: string, allKeywords: string[]): string[] {
  if (!text || !allKeywords.length) return [];
  return allKeywords.filter((kw) => buildKeywordRegex(kw, "i").test(text));
}

/**
 * Sau mỗi step: consume keywords đã dùng, trả lại assigned-but-unused về pool.
 *
 * Logic:
 * 1. Keywords đã dùng (usedInStep) → chuyển vào used[section], xóa khỏi mọi pool
 * 2. Keywords còn trong assigned[section] nhưng không dùng → trả về available_pool
 */
export function consumeStep(
  pool: KeywordPool,
  usedInStep: string[],
  section: "title" | "bullets" | "description"
): KeywordPool {
  const usedSet = new Set(usedInStep.map((k) => k.toLowerCase()));

  // Build sets of all currently tracked keywords (to remove consumed ones)
  const removeFromPool = (arr: string[]) =>
    arr.filter((k) => !usedSet.has(k.toLowerCase()));

  // Assigned keywords for this section that were NOT used → return to available_pool
  const unusedAssigned = pool.assigned[section].filter(
    (k) => !usedSet.has(k.toLowerCase())
  );

  const next: KeywordPool = {
    assigned: {
      ...pool.assigned,
      [section]: [], // clear assigned for this section after consumption
    },
    available_pool: [
      ...removeFromPool(pool.available_pool),
      ...unusedAssigned,
    ],
    used: {
      ...pool.used,
      [section]: [...pool.used[section], ...usedInStep],
    },
  };

  return next;
}

/** Lấy tất cả keywords chưa dùng (remaining after pipeline) */
export function getRemainingKeywords(pool: KeywordPool): string[] {
  return [...pool.available_pool];
}
