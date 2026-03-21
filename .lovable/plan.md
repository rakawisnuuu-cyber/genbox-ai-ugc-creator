

## Phase 1: Fix Image Storyboard Quality

The root cause is clear: the storyboard frame generation appends ~400 words of redundant quality/skin/negative blocks to every prompt AND sends 3-4+ competing reference images. External tools work better because they send clean prompts with fewer images.

### Changes

**File: `src/pages/GeneratePage.tsx`**

1. **Remove prompt bloat** (line 895)
   - Current: `enhancedFramePrompt = currentPrompt + SKIN_BLOCK + QUALITY_BLOCK + NEGATIVE_BLOCK` (~400 extra words)
   - New: Just use `currentPrompt` as-is — the Gemini-generated prompt already contains quality direction. Add only a minimal 1-line suffix: `"Ultra-realistic photo, 8K, natural lighting. No cartoon, no CGI, no watermark."`

2. **Limit image_input to max 2 images** (lines 885-893)
   - Current: Sends reference_photo + hero_image + product + frame0 = up to 4 images
   - New priority logic:
     - If `idx > 0` and frame 0 exists → use frame 0 as primary (visual consistency anchor)
     - Then add ONE character reference (prefer `reference_photo_url` over `hero_image_url`, not both)
     - Product image only if no character ref exists
     - Max 2 images total

3. **Change output_format from "jpg" to "png"** (line 103)
   - Lossless output = sharper details, especially for faces

4. **Clean up unused blocks**
   - Remove `SKIN_BLOCK`, `ENV_REALISM_BLOCK`, `UGC_STYLE_BLOCK` constants (lines 73-82) — they're only used in the storyboard path and are causing quality degradation
   - Keep `QUALITY_BLOCK` and `NEGATIVE_BLOCK` as they're still referenced in the single-image generation path (line 635, 720 area) — but trim them down

**No changes to**: CreateCharacterPage.tsx (its blocks work fine for character generation), video generation, or UI layout.

### Why This Fixes It

- **Fewer images** = model focuses on the prompt instead of trying to reconcile 4 conflicting references
- **Cleaner prompt** = model interprets the Gemini-crafted narrative prompt without being confused by 400 words of contradictory quality directives
- **PNG** = no lossy compression artifacts on faces/skin

