/** A complete Amazon product listing */
export interface ContentListing {
  title: string;
  bullets: string[];
  description: string;
  searchTerms: string;
}

/** Input payload sent to the generate API */
export interface GenerateRequest {
  keywords: string;
  skillName: string;
  notes?: string;
}

/** Response from the generate API */
export interface GenerateResponse {
  success: boolean;
  listing?: ContentListing;
  error?: string;
}

/** Available skill profiles */
export const SKILL_OPTIONS = [
  { value: "Editorial_Pro_V2.md", label: "Editorial Pro V2" },
  { value: "Luxury_Brand.md", label: "Luxury Brand" },
  { value: "Budget_Friendly.md", label: "Budget Friendly" },
] as const;

export type SkillOption = (typeof SKILL_OPTIONS)[number]["value"];

/** Amazon content character limits */
export const CONTENT_LIMITS = {
  title: 200,
  bulletItem: 250,
  bulletMax: 10,
  bulletMin: 5,
  description: 1000,
  searchTerms: 250,
} as const;
