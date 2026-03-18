
Goal: Evolve GENBOX into a UGC Ad Creation Engine.

## Completed Changes

### Phase 1 (Previous Audit)
- Cancel buttons fixed, prompt compression, storyboard prompts exposed, Gemini timeout 60s, landing page perf, shared hooks

### Phase 2 — Ad Engine Evolution

### 1. Environment Library Overhaul
- Replaced all Western-centric environments with Indonesian micro-environments per reference doc
- Shortened descriptions from ~60 words to ~25 words (massive token savings)
- Categories: Skincare (Bathroom Vanity, Morning Routine Sink, Bedroom Vanity, Spa Style), Fashion (Bedroom Mirror, Closet Area, Apartment Hallway, Balcony), Food (Kitchen Counter, Breakfast Table, Kitchen Island, Snack Table), Electronics (Creator Desk, Bedroom Work Desk, Gaming Setup, Coffee Table Review), Health (Living Room Workout, Home Yoga Corner, Balcony Workout, Home Gym Corner), Home (Couch Talk, Bed Talk, Desk Chat, Balcony Vlog, Kamar Kost)

### 2. Content Templates Expanded (8 → 14)
- Added: GRWM, 3 Alasan, Expectation vs Reality, Tutorial Singkat, Day in My Life, First Impression
- Each with full timing (20s) and compressed timing (10s) beats
- All with `recommendedFor` category mappings
- Updated `tiktok-hooks.ts` with hook categories and body scripts for all 6 new templates

### 3. Storyboard Beats for New Templates
- Added all 6 new template beats to `storyboard-angles.ts`
- Added `constraints` field to StoryboardBeat interface
- Enforced `{ noProductUsage: true }` on Before>After frame 1, GRWM frame 1, Day in My Life frame 1
- These constraints are available for Gemini prompt generation to enforce narrative logic

### 4. API Key Setup Modal
- Created `ApiKeySetupModal.tsx` — step-by-step wizard (Intro → Kie AI → Gemini → Done)
- Shows instructions for obtaining each key with external links
- Password toggle, test key, save & next flow
- Progress bar across steps
- Triggered from `DashboardHome.tsx` when API keys are missing

### Phase 3 — Template-First Flow & Dynamic Narratives

### 5. Flexible Narrative Engine
- Replaced rigid Hook/Build/Demo/Proof/Convert roles with per-template flexible strings (35+ unique roles)
- `storyboard-angles.ts`: Each template defines its own narrative stages (e.g., Problem→Pain Amplification→Demo→Result→CTA)
- Position-based badge coloring system (works with any storyRole string)
- `frame-lock-prompt.ts`: Updated with 35+ role-to-motion mappings for flexible roles

### 6. Template-First GeneratePage Flow
- Moved template picker to left panel Step 3 ("Pilih Gaya Konten")
- Removed mandatory "Base Image" step — Frame 1 is the establishing shot
- "Generate Storyboard" replaces old "Generate Prompt" + "Generate Image" flow
- Right panel now shows storyboard grid directly (removed old single-image view)
- Beat preview shown in both left panel and right panel empty state
- Frames 1-4 chain from Frame 0's result for visual consistency

### 7. Dynamic Motion Suggestions
- Replaced static `action-chips.ts` hardcoded lists with `generateDynamicChips()` using Gemini
- Product-aware casual Indonesian motion instructions
- Cached per template+beat+category combo

### 8. Product DNA Enrichment
- Added `getProductContext()` to `product-dna.ts`
- Extracts target user, usage context, emotional angle from DNA fields
- Injected into prompt generation for more authentic outputs

### 9. VideoPage Flexible Roles
- Replaced rigid ROLE_COLORS with position-based getRoleColor()
- Replaced getSmartDialogSuggestion with comprehensive ROLE_DIALOG_MAP (35+ roles)
- Each role maps to natural casual Indonesian dialog suggestions
- Role badges now use position-based coloring matching storyboard-angles.ts

## Remaining
- Character prompt visibility in CreateCharacterPage
- Gallery saving fix for single images (upload to storage before DB insert)
- Media analysis panel (MediaInsightsPanel component)

## Files Changed
- `src/lib/category-options.ts` — full environment rewrite
- `src/lib/content-templates.ts` — 6 new templates added
- `src/lib/storyboard-angles.ts` — flexible narrative roles, per-template beats, constraints
- `src/lib/tiktok-hooks.ts` — hook maps and body scripts for new templates
- `src/lib/action-chips.ts` — dynamic Gemini-powered suggestions
- `src/lib/product-dna.ts` — getProductContext() enrichment
- `src/lib/frame-lock-prompt.ts` — 35+ flexible role mappings
- `src/components/ApiKeySetupModal.tsx` — new setup wizard
- `src/pages/DashboardHome.tsx` — triggers API key modal
- `src/pages/GeneratePage.tsx` — template-first flow, storyboard-direct right panel
- `src/pages/VideoPage.tsx` — flexible narrative roles, position-based coloring
