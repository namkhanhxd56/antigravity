/**
 * Skill Splitter — tách 1 skill file thành 3 section riêng.
 *
 * Format chuẩn của skill file:
 * ```
 * ## TITLE
 * [nội dung cho title section]
 *
 * ## BULLETS
 * [nội dung cho bullets section]
 *
 * ## DESCRIPTION
 * [nội dung cho description section]
 * ```
 *
 * Phần nằm trước heading đầu tiên được coi là preamble chung
 * và được gắn vào đầu tất cả sections.
 */

export interface SplitSkill {
  image: string;
  title: string;
  bullets: string;
  description: string;
  /** true nếu file có đủ cả 3 sections bắt buộc (TITLE, BULLET POINTS, DESCRIPTION) */
  isValid: boolean;
}

type SectionKey = "image" | "title" | "bullets" | "description";

/** Map từ heading text → section key */
const HEADING_MAP: Record<string, SectionKey> = {
  "IMAGE": "image",
  "TITLE": "title",
  "BULLET POINTS": "bullets",
  "DESCRIPTION": "description",
};

export function splitSkill(content: string): SplitSkill {
  const lines = content.split("\n");

  let preamble = "";
  let inPreamble = true;              // true cho đến khi gặp ## heading đầu tiên
  let currentSection: SectionKey | null = null;
  const sections: Record<SectionKey, string[]> = {
    image: [],
    title: [],
    bullets: [],
    description: [],
  };

  for (const line of lines) {
    // Bất kỳ ## heading nào đều kết thúc preamble
    const anyH2 = line.match(/^##\s+(.+?)\s*$/i);
    if (anyH2) {
      inPreamble = false;
      const key = anyH2[1].toUpperCase();
      // Recognized → switch section; unrecognized (e.g. ## CHECKLIST) → null = discard
      currentSection = HEADING_MAP[key] ?? null;
    } else if (inPreamble) {
      preamble += line + "\n";
    } else if (currentSection !== null) {
      sections[currentSection].push(line);
    }
    // Unrecognized ## heading's content → silently discarded
  }

  const trimPreamble = preamble.trim();

  const build = (key: SectionKey) => {
    const body = sections[key].join("\n").trim();
    if (!body) return "";
    // IMAGE section không gắn preamble (không cần brand rules cho phân tích ảnh)
    if (key === "image") return body;
    return trimPreamble ? `${trimPreamble}\n\n${body}` : body;
  };

  return {
    image: build("image"),
    title: build("title"),
    bullets: build("bullets"),
    description: build("description"),
    isValid: !!(sections.title.join("").trim() || sections.bullets.join("").trim() || sections.description.join("").trim()),
  };
}

// ─── localStorage helpers (client-side only) ─────────────────────────────────

const LS_IMAGE = "skill_split_image";
const LS_TITLE = "skill_split_title";
const LS_BULLETS = "skill_split_bullets";
const LS_DESCRIPTION = "skill_split_description";
const LS_SKILL_NAME = "skill_split_name";

/** Lưu split result vào localStorage */
export function saveSplitToStorage(skillName: string, split: SplitSkill): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_IMAGE, split.image);
  localStorage.setItem(LS_TITLE, split.title);
  localStorage.setItem(LS_BULLETS, split.bullets);
  localStorage.setItem(LS_DESCRIPTION, split.description);
  localStorage.setItem(LS_SKILL_NAME, skillName);
}

/** Đọc split result từ localStorage */
export function loadSplitFromStorage(): { skillName: string; split: SplitSkill } | null {
  if (typeof window === "undefined") return null;
  const skillName = localStorage.getItem(LS_SKILL_NAME);
  const title = localStorage.getItem(LS_TITLE);
  const image = localStorage.getItem(LS_IMAGE);
  const bullets = localStorage.getItem(LS_BULLETS);
  const description = localStorage.getItem(LS_DESCRIPTION);
  if (!skillName || title === null) return null;
  return {
    skillName,
    split: {
      image: image ?? "",
      title: title ?? "",
      bullets: bullets ?? "",
      description: description ?? "",
      isValid: !!(title || bullets || description),
    },
  };
}

/** Xóa split cache khỏi localStorage */
export function clearSplitStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_IMAGE);
  localStorage.removeItem(LS_TITLE);
  localStorage.removeItem(LS_BULLETS);
  localStorage.removeItem(LS_DESCRIPTION);
  localStorage.removeItem(LS_SKILL_NAME);
}
