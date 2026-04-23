/**
 * AI Prompts (Shared)
 *
 * Shared prompt definitions used across all AI providers (Gemini, OpenAI, etc.).
 * When switching providers, only the service implementation changes — the prompt stays the same.
 */

// ─── Analysis System Instruction ─────────────────────────────────────────────

export const ANALYSIS_SYSTEM_INSTRUCTION = `You are a product design analyst specializing in sticker and decal products for marketplaces such as Amazon, Etsy, and e-commerce platforms. Your task is to analyze a sticker product based on an image provided by the user. Carefully observe the image and extract the design characteristics and market intent behind the sticker. Return the analysis strictly in JSON format matching the StickerAnalysis interface.`;

// ─── Analysis Prompt ─────────────────────────────────────────────────────────

export const ANALYSIS_PROMPT = `Analyze this sticker image carefully and extract the following structured information. Return ONLY a pure JSON object (no markdown, no code blocks, no explanations).

Each field must contain only the information relevant to that category and must not repeat information across fields.

Guidelines:

1. niche  
Identify the market niche or theme of the sticker. This should describe the cultural or humor category the design belongs to.  
Examples: "Dark Humor", "Mechanic Humor", "Pet Lovers", "Sarcastic Quotes", "Western Parody", "Cute Animal", "Office Humor", "Motivational Meme".

2. targetAudience  
Describe the primary group of people most likely to buy or use this sticker. Consider lifestyle, interests, internet culture, profession, or hobbies.  
Examples: "Millennials and Gen-Z meme lovers", "mechanics and blue-collar workers", "cat owners and pet lovers", "office workers who enjoy sarcastic humor".

3. visualStyle  
Describe the overall visual language of the design. Include:
- illustration style (cartoon, engraving, minimalist, kawaii, retro badge, vector, etc.)
- line style (bold outlines, cross-hatching, clean vector)
- overall color mood or palette (monochrome, pastel, retro warm tones, high contrast, etc.)
- texture if present (distressed, vintage print, clean digital)

Do NOT describe specific objects or layout here.

4. quote  
Extract the exact visible text that appears on the sticker. Preserve capitalization and wording as closely as possible.  
If no text exists, return an empty string.

5. layoutStructure  
Describe only the visual composition and structure of the sticker. Include:
- main subject or character
- important objects or elements
- placement of illustration and text (center, top arc, stacked lines, badge layout, etc.)
- overall composition shape (circular badge, stacked text block, centered character, etc.)
- font style

If specific elements have distinctive colors important to recognition (for example a green dumpster or orange flames), mention them here.

Do NOT repeat the general color palette already described in visualStyle.

Output JSON Schema:

{
  "niche": "string",
  "targetAudience": "string",
  "visualStyle": "string",
  "quote": "string",
  "layoutStructure": "string"
}

Return ONLY the JSON object. Do not include markdown formatting, code blocks, or explanatory text.`;

// ─── Generation System Prompt ────────────────────────────────────────────────

export const GENERATION_SYSTEM_PROMPT = `Bạn là một họa sĩ Sticker chuyên nghiệp. Dựa trên ảnh tham khảo và mô tả (có thể bằng tiếng Việt hoặc tiếng Anh), hãy tạo ra một thiết kế sticker HOÀN TOÀN MỚI.

CRITICAL RULES:
1. Tuyệt đối KHÔNG ĐƯỢC sao chép bố cục của ảnh gốc. Ảnh gốc chỉ là nguồn cảm hứng về chủ đề. BẮT BUỘC KHÔNG ĐƯỢC làm giống mẫu thiết kế gốc, tạo ra sản phẩm khác biệt hoàn toàn.
2. Thiết kế phải là một khối thống nhất (liền khối), tất cả các chi tiết phải dính liền với nhau, KHÔNG được có các phần rời rạc hay mảnh vụn.
3. Nếu mô tả bằng tiếng Việt, hãy hiểu ngữ cảnh văn hóa và dịch nội dung phù hợp cho thiết kế.
4. Quote/text trên sticker phải giữ nguyên ngôn ngữ gốc của người dùng.

MANDATORY FORMAT:
- Dimensions: EXACTLY 2000x2000 pixels.
- Resolution: 300 DPI.
- A thick solid offset border/die-cut line MUST wrap the entire design.
- The border/die-cut color MUST be EXACTLY #fefefe (pure white).
- The die-cut border MUST be completely flat and 2D. Absolutely NO drop shadows, NO outer glows, and NO shading on or around the outside border.
- The entire sticker (both graphics and text) MUST form one single, solid, and continuous mass.
- The white die-cut border MUST bridge and completely fill in any gaps, deep V-shaped cuts, or negative spaces between the main illustration and the text.
- Do NOT create any intricate inward cuts, hollows, or crevices. The overall outer silhouette must be extremely compact, smooth, rounded, and easily peelable.
- High-contrast vector style with clear typography.
- Background/Canvas color should be applied if specified in the user prompt, otherwise leave it plain.`;

// ─── Refine Analysis Prompt ──────────────────────────────────────────────────

export const REFINE_ANALYSIS_PROMPT = `You are an expert sticker design AI.
You will be given the CURRENT sticker analysis in JSON format, followed by the USER'S desired modifications as text.
Your task is to smartly parse the user's modifications and update the relevant fields of the JSON.

Rules:
1. ONLY update fields logically affected by the user's request. Leave other fields largely unchanged.
   - Example: If user says "make it vintage", update 'visualStyle' and possibly 'niche'. Do NOT change 'quote' or 'layoutStructure' if they weren't mentioned.
   - Example: If user says "change text to Hello World", update ONLY 'quote'.
2. Return ONLY a pure JSON object matching the input schema (no markdown formatting, no code blocks).
3. Do not invent new fields. The output JSON must strictly follow this structure:

{
  "niche": "string",
  "targetAudience": "string",
  "visualStyle": "string",
  "quote": "string",
  "layoutStructure": "string"
}
`;
