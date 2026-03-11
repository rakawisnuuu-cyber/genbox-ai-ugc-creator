

# Plan: Evolve GENBOX into a UGC Ad Creation Engine

This is a large scope request covering 6 feature areas. Here is my honest assessment followed by the implementation plan.

## Honest Assessment

**What will genuinely improve the product:**
- Revamping storyboard flow (template-first) is a significant UX improvement
- Enriching environments per your reference doc is high-value and directly improves output quality
- API key setup pop-up will reduce user confusion and drop-off
- Saving generated media to gallery is a real bug fix -- videos already save, but the UX needs verification
- Character prompt visibility is a small but meaningful transparency win
- Media analysis post-generation is ambitious but genuinely differentiating

**What needs scoping down:**
- Media analysis should start simple (extract product name, features, ICP from the generated prompt/DNA, not from analyzing the actual generated image) -- analyzing generated images with Gemini Vision adds cost and latency for marginal value since we already HAVE the product DNA
- The storyboard "template-first" flow is a significant refactor of GeneratePage.tsx -- it changes the core workflow

## Implementation Plan

### 1. Revamp Storyboard Flow (Template-First)

**Current flow:** Upload product → Select character → Generate prompt → Generate base image → Pick template → Generate storyboard

**New flow:** Upload product → Select character → Pick content template → System generates storyboard structure with per-frame prompts → User reviews/edits → Generate all frames

**Changes:**
- `src/pages/GeneratePage.tsx`: Move template selection BEFORE prompt generation. When template is selected, auto-populate the 5-frame storyboard beats with pre-generated prompts
- `src/lib/storyboard-angles.ts`: Enrich beat descriptions to enforce template logic (e.g., Before>After frame 1 must NOT show product being used)
- `src/lib/content-templates.ts`: Expand from 8 to 14+ templates with detailed, logical frame prompts

**New content templates to add:**
- "GRWM (Get Ready With Me)" -- morning routine with product integration
- "3 Alasan" -- 3 reasons why this product works
- "Expectation vs Reality" -- what you expect vs what you get
- "Tutorial Singkat" -- quick how-to tutorial
- "Day in My Life" -- product as part of daily life montage
- "Honest First Impression" -- genuine first-time try

**Before>After rule enforcement:** Add a `constraints` field per beat:
```typescript
{ noProductUsage: true } // Frame 1 of before_after
```

### 2. API Key Setup Pop-Up

**Files:**
- Create `src/components/ApiKeySetupModal.tsx` -- modal with step-by-step instructions for Kie AI and Gemini keys
- `src/pages/Dashboard.tsx` or `src/contexts/AuthContext.tsx` -- trigger modal when user has no valid API keys

**Features:**
- Detects missing/invalid keys on first dashboard visit
- Step-by-step cards for each provider (where to get key, how to paste)
- Embed tutorial video via iframe (you provide the video URL)
- "Skip for now" option
- Links to Settings page for manual setup

### 3. Character Creation Prompt Visibility

**File:** `src/pages/CreateCharacterPage.tsx`

- Before generating, show the composed prompt in a collapsible panel
- Add a "Preview Prompt" button next to the generate button
- Display the full prompt text that will be sent to Kie AI (assembled from all the blocks: identity, skin, quality, negative, etc.)

### 4. Generated Media Saving to Gallery

**Current state review:**
- Single image generation (`GeneratePage.tsx` line 664): Already inserts into `generations` table
- Storyboard beats (`GeneratePage.tsx` line 831): Already inserts into `generations` table
- Video frames (`VideoPage.tsx` line 815): Already inserts into `generations` table

**Actual issue:** The gallery query in `GalleryPage.tsx` filters by type and may not show all types. Need to verify the gallery displays storyboard images and videos correctly. Also, if the image URL is an external CDN URL (from Kie AI) rather than stored in our storage, it may expire.

**Fix:**
- Ensure all generated images are uploaded to storage before saving URL to DB (storyboard already does this, single image does NOT)
- Upload single-gen images to `product-images` bucket before saving
- Verify gallery page query includes all generation types

### 5. Enrich Environment Library

**File:** `src/lib/category-options.ts`

Per your reference document, replace current environments with Indonesian-focused micro-environments. Key changes:

- **Skincare:** Replace "Bathroom Mewah" (Western luxury) with "Bathroom Vanity" (compact Indonesian), "Morning Routine Sink", "Bedroom Vanity", "Spa Style Bathroom"
- **Fashion:** Replace "Rooftop Golden Hour" with "Bedroom Mirror Selfie", "Closet Area", "Apartment Hallway", "Balcony Outfit Shot"
- **Electronics:** Replace "Commuter" with "Creator Desk Setup", "Bedroom Work Desk", "Gaming Setup", "Coffee Table Review"
- **Health:** Replace "Gym Locker" with "Living Room Workout", "Home Yoga Corner", "Balcony Workout", "Home Gym Corner"
- **Food:** Replace "Outdoor Brunch" with "Kitchen Counter" (Indonesian), "Breakfast Table", "Kitchen Island", "Snack Table"
- **Home:** Add "Couch Talk Setup", "Bed Talk Scene", "Desk Chat Setup", "Balcony Vlog Scene"

**Critical change:** Shorten descriptions from ~60 words to ~25 words per your doc's guideline. Current descriptions are WAY too long and waste tokens.

### 6. Media Analysis Feature (Post-Generation Insights)

**Approach:** Use existing Product DNA + generation metadata (NOT re-analyzing the image) to provide structured insights. This is fast, free, and already available.

**Implementation:**
- Create `src/components/MediaInsightsPanel.tsx` -- displays after generation completes
- Extract from existing data: Product name, category, features, suggested ICP, script hooks
- Use Gemini (via existing key) to generate: Ad copy suggestions, hook variations, target audience description, feature highlights
- Display as a collapsible panel below the generated result

**Data flow:** Product DNA + character info + template + beat → Gemini prompt → structured insights JSON → UI panel

---

## File Change Summary

| File | Action |
|------|--------|
| `src/lib/content-templates.ts` | Add 6 new templates, add `constraints` field |
| `src/lib/storyboard-angles.ts` | Add beats for new templates, enforce constraints |
| `src/lib/category-options.ts` | Replace environments with Indonesian micro-environments, shorten descriptions |
| `src/pages/GeneratePage.tsx` | Reorder flow: template before generation, upload single-gen images to storage |
| `src/components/ApiKeySetupModal.tsx` | New: setup wizard modal |
| `src/pages/Dashboard.tsx` | Trigger API key modal on missing keys |
| `src/pages/CreateCharacterPage.tsx` | Add prompt preview panel |
| `src/components/MediaInsightsPanel.tsx` | New: post-generation insights |
| `src/pages/GalleryPage.tsx` | Verify all gen types display correctly |

## Implementation Order

1. Environment library overhaul (standalone, no dependencies)
2. Content templates expansion (standalone)
3. API key setup modal (standalone)
4. Character prompt visibility (standalone)
5. Gallery saving fix for single images (small fix)
6. Storyboard flow revamp (largest change, depends on 1+2)
7. Media analysis panel (depends on 6 being stable)

