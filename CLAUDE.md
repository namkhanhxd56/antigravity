# CLAUDE.md — Antigravity Project

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **UI**: React 19, Tailwind CSS v4
- **AI**: Google Gemini (`@google/generative-ai`)
- **Icons**: Google Material Symbols Outlined (via Google Fonts CDN)
- **Deploy**: Netlify / Vercel compatible

## Project Overview

**AI Sticker Studio** — a multi-tool platform. Homepage (`/`) shows module cards.

Active modules:
- `/sticker-generator` — AI sticker generation via Gemini
- `/content-curator` — AMZ Content Curator (Amazon listing generator)

Coming soon: `/mockup-generator`, `/dashboard`

---

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout (Space Grotesk font, dark mode)
│   ├── page.tsx                    # Homepage module cards
│   ├── globals.css
│   ├── api/
│   │   └── settings/route.ts       # GET/POST API keys (masked)
│   │
│   ├── (user)/                     # Route group — user-facing tools
│   │   ├── sticker-generator/      # Sticker Generator module
│   │   │   ├── page.tsx            # Client root — owns all state
│   │   │   ├── components/
│   │   │   │   ├── SourceSidebar.tsx
│   │   │   │   ├── AnalyticsPanel.tsx
│   │   │   │   └── ResultGrid.tsx
│   │   │   ├── api/
│   │   │   │   ├── analyze/route.ts
│   │   │   │   ├── generate/route.ts
│   │   │   │   └── refine/route.ts
│   │   │   ├── services/
│   │   │   │   ├── gemini.service.ts
│   │   │   │   ├── provider.ts
│   │   │   │   ├── router.service.ts
│   │   │   │   └── prompts.ts
│   │   │   └── lib/
│   │   │       ├── types.ts
│   │   │       └── rules.ts
│   │   │
│   │   ├── content-curator/        # AMZ Content Curator module
│   │   │   ├── layout.tsx          # Navbar (orange #EA580C) + footer
│   │   │   ├── page.tsx            # 3-column grid: left(3) | middle(4) | right(5)
│   │   │   ├── components/
│   │   │   │   ├── ProductAsset.tsx    # Left col top — product image upload
│   │   │   │   ├── SkillConfig.tsx     # Left col bottom — skill .md selector + Create btn
│   │   │   │   ├── KeywordBank.tsx     # Middle col — keyword textarea
│   │   │   │   └── ContentCanvas.tsx   # Right col — title, bullets, desc, search terms
│   │   │   ├── api/                # To be created
│   │   │   │   ├── generate/route.ts   # POST: generate full listing
│   │   │   │   └── rewrite/route.ts    # POST: rewrite a single section
│   │   │   ├── lib/                # To be created
│   │   │   │   ├── types.ts
│   │   │   │   ├── promptBuilder.ts    # skill .md + keywords + notes → prompt
│   │   │   │   ├── charCount.ts        # count chars, warn over limit
│   │   │   │   └── csvParser.ts        # parse H10/Cerebro keyword CSV
│   │   │   └── skills/             # To be created — .md prompt templates
│   │   │       ├── Editorial_Pro_V2.md
│   │   │       ├── Luxury_Brand.md
│   │   │       └── Budget_Friendly.md
│   │   │
│   │   ├── mockup-generator/page.tsx   # Coming Soon placeholder
│   │   └── settings/page.tsx           # API key management UI
│   │
│   └── (admin)/
│       └── dashboard/page.tsx      # Coming Soon placeholder
│
├── components/
│   └── shared/
│       └── TopNav.tsx              # Shared top nav (used by sticker-generator)
│
├── lib/
│   ├── utils.ts                    # fileToBase64, general helpers
│   ├── key-storage.ts              # Server: read/write data/api-keys.json
│   └── client-key-storage.ts       # Client: localStorage API key access
│
└── services/
    └── mockup/index.ts
```

---

## AMZ Content Curator — Spec

### Layout (3 columns)
```
[ ProductAsset  ]  [ KeywordBank (full height) ]  [ ContentCanvas         ]
[ SkillConfig   ]                                  [ Title + Bullets +     ]
                                                   [ Description +         ]
                                                   [ Search Terms +        ]
                                                   [ ExportPanel ]         ]
```

### State Architecture (lift to page.tsx — no external state lib)
- `inputState` — image URL, selected skill, occasion chips, notes
- `keywordState` — keywords string / parsed array
- `contentState` — title, bullets[], description, searchTerms
- `uiState` — isGenerating, isRewriting, activeSection, errors

### API Routes to Build
| Route | Method | Purpose |
|---|---|---|
| `/content-curator/api/generate` | POST | Full listing from keywords + skill + notes |
| `/content-curator/api/rewrite` | POST | Rewrite one section (title/bullets/desc) |

### Prompt Building (lib/promptBuilder.ts)
Input: skill `.md` content + keywords[] + notes + occasion → full prompt string

### Content Limits (Amazon)
- Title: 200 chars
- Bullets: 5–10 items, ~250 chars each
- Description: 1000 chars
- Search Terms: 250 chars

### Development Sprints
1. **Sprint 1** — Generate flow: KeywordBank → SkillConfig → promptBuilder → API → ContentCanvas
2. **Sprint 2** — Edit + rewrite: NoteInput + rewrite API + per-section Rewrite button + inline edit
3. **Sprint 3** — Customization: ImageUpload (real upload), occasion chips, intensity
4. **Sprint 4** — Export: copy TSV for Excel, column toggle/reorder
5. **Sprint 5** — Keyword intelligence: highlight keywords in generated content

---

## API Key Pattern

Keys are resolved server-side via `resolveApiKey()` from `@/lib/key-storage`:
1. `process.env` (`.env.local`) — highest priority
2. `data/api-keys.json` — saved via settings UI

Client passes key via header `x-gemini-api-key` when using client-stored key.

```ts
import { resolveApiKey } from "@/lib/key-storage";
const apiKey = resolveApiKey("GEMINI_API_KEY");
```

## Design Tokens (Content Curator)

| Token | Value |
|---|---|
| Brand orange | `#EA580C` |
| Dark orange (buttons) | `#9a5015` |
| Background | `#F3F4F6` |
| Card bg | `white` |
| Footer bg | `#111827` |
| Font | system sans (layout.tsx uses Space Grotesk only on root) |

## Conventions

- Route handlers: use `NextRequest` / `NextResponse` from `next/server`
- Client components: `"use client"` at top, state in page-level component
- No external state library — lift state to page.tsx, pass down as props
- Icons: `<span className="material-symbols-outlined">icon_name</span>`
- API errors: return `{ success: false, error: string }` with appropriate HTTP status
- Do not mock data in production paths — keep placeholder UI clearly marked
