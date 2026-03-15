/**
 * Sticker Master Rules
 *
 * Core design constraints that govern all AI-generated sticker outputs.
 * These rules are injected into every prompt sent to the AI model to ensure
 * consistent, high-quality sticker designs with 100% creative originality.
 */
export const STICKER_MASTER_RULES = `CREATE AN ENTIRELY NEW DESIGN. Do not copy the layout of the original image. Use the uploaded image ONLY as a thematic or conceptual inspiration. Experiment with new compositions, character poses, and artistic interpretations. Always maintain: Isolated object, thick white offset border, solid white background, vector high-contrast style.`;
