
Goal: Evolve GENBOX into a UGC Ad Creation Engine.

## Completed Changes

### Phase 1 (Previous Audit)
- Cancel buttons fixed, prompt compression, storyboard prompts exposed, Gemini timeout 60s, landing page perf, shared hooks

### Phase 2 (Current — Ad Engine Evolution)

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

## Remaining (Next Message)
- Character prompt visibility in CreateCharacterPage
- Gallery saving fix for single images (upload to storage before DB insert)
- Media analysis panel (MediaInsightsPanel component)
- Storyboard constraint enforcement in GeneratePage prompt generation

## Files Changed
- `src/lib/category-options.ts` — full environment rewrite
- `src/lib/content-templates.ts` — 6 new templates added
- `src/lib/storyboard-angles.ts` — 6 new beat sets, constraints field
- `src/lib/tiktok-hooks.ts` — hook maps and body scripts for new templates
- `src/components/ApiKeySetupModal.tsx` — new setup wizard
- `src/pages/DashboardHome.tsx` — triggers API key modal
