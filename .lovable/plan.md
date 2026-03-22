

## Updated Plan: Build Complete Image Studio (GeneratePage.tsx)

Same plan as previously approved, with the corrected file count.

### Modified files (3):

1. **`src/lib/content-templates.ts`** — Add 4 commercial template keys (`hero_product`, `brand_campaign`, `katalog_produk`, `studio_editorial`) to `ContentTemplateKey` type and add their full `ContentTemplate` entries with timing beats, descriptions, and category recommendations

2. **`src/lib/kie-video-generation.ts`** — Add `extendVeoVideo({ taskId, prompt, model, apiKey })` function for extended Veo segments (POST `/veo/extend`, poll same as regular Veo)

3. **`src/lib/storyboard-angles.ts`** — Add 4 commercial storyboard beat arrays to the `STORYBOARDS` record:
   - `hero_product`: 5 beats focused on product-centric shots (Hero Angle → Detail Close-up → Lifestyle Context → Feature Highlight → Brand Statement)
   - `brand_campaign`: 5 beats for brand storytelling (Brand Mood → Identity Shot → Product Integration → Aspirational Moment → Brand Lockup)
   - `katalog_produk`: 5 beats for catalog/e-commerce (Clean Product → Variant Display → Scale/Size → Texture Detail → Styled Flat Lay)
   - `studio_editorial`: 5 beats for editorial photography (Editorial Pose → Fashion Detail → Environment Mood → Dynamic Movement → Magazine Cover)

### New files (5) — unchanged from approved plan:
1. `src/pages/GeneratePage.tsx` — complete rewrite
2. `src/lib/image-generation-engine.ts` — shot planner + realism directives
3. `src/lib/kie-image-generation.ts` — Kie AI image generation client
4. `src/hooks/useImageGeneration.ts` — generation progress hook
5. `src/lib/image-to-video-prompts.ts` — motion prompt templates

### Build order: Part 1 → Part 2 → Part 3 → Part 4 (sequential)

