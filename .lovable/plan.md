

# Plan: Template-First Flow, Dynamic Narratives & Smart Motion

## Honest Assessment

**Your instinct is correct on all three points:**

1. **Template-specific narrative structures** — Forcing every template into Hook→Build→Demo→Proof→Convert is wrong. A "Testimonial" template doesn't need a "Demo" beat. A "Tutorial" doesn't need a "Proof" beat. Each template should have its own narrative stages. This will make the storyboards feel intentional rather than formulaic.

2. **Dynamic motion suggestions** — The current action chip system (`action-chips.ts`) has hardcoded Indonesian phrases per category, but only covers fashion/skincare/electronics. Food, health, and home are empty arrays (`[]`). And the fixed list means users see repetitive suggestions. Dynamic generation based on product DNA + beat context will be significantly better.

3. **Product DNA-driven prompts** — The current system uses DNA for category routing but doesn't deeply inject product intelligence into the prompt narrative. The Gemini system prompt says generic things like "analyze the product image" rather than "this is a face serum with hyaluronic acid targeting dehydrated skin — the demo should show the dropper dispensing onto fingertips, then patting into cheeks."

## What Changes

### A. Template-Specific Narrative Structures

Replace the rigid 5-role system with per-template narrative stages:

```text
CURRENT (forced for all):
  Hook → Build → Demo → Proof → Convert

NEW (template-specific):

problem_solution:
  Problem → Pain Amplification → Product Intro → Demo → Result → CTA
  (6 beats, but we render 5 frames — combine Pain+Intro)

review_jujur (Testimonial):
  Hook → Personal Experience → Product Usage → Result → Soft CTA

tutorial_singkat:
  Hook → Show Product → Step 1 → Step 2/Result → CTA

before_after:
  Before State [noProduct] → Introduce Product → Application → After Reveal → Confidence

grwm:
  Morning [noProduct] → Start Routine → Product Step → Almost Ready → Ready & Go

expectation_reality:
  Skeptical → Expectation → Try It → Reality Reveal → Converted

first_impression:
  First Look → First Open → First Try → Assessment → Verdict

day_in_my_life:
  Morning [noProduct] → Midday → Product Moment → Benefit → Evening

asmr_aesthetic:
  Texture Close-up → Slow Open → Sensory → Application → Serene Reveal

pov_style:
  POV Reach → POV Pickup → POV Use → POV Result → Face Reveal
```

**Interface change:** Replace `storyRole: "Hook" | "Build" | "Demo" | "Proof" | "Convert"` with a flexible string type. Each template defines its own role names and colors.

### B. Template-First Generate Flow

**New UI order in left panel:**
1. Upload Produk (stays)
2. Pilih Karakter (stays)
3. **Pilih Gaya Konten** (NEW — template picker moved here)
4. Pengaturan Scene (environment, pose, mood — stays)
5. Storyboard Preview (auto-populated beat cards based on template + DNA)
6. Generate All Frames button

**Key behavior change:** When template is selected AND product DNA exists, the system auto-generates storyboard beat descriptions adapted to the specific product. No separate "generate base image first" step — the first frame IS Frame 1 of the storyboard.

The "Generate Prompt" button becomes "Generate Storyboard" — it calls Gemini ONCE with the full template structure + product DNA + character, and gets back all 5 frame prompts in a single JSON response. Then generates all frames sequentially.

### C. Dynamic Motion Suggestions (Video)

Replace `action-chips.ts` hardcoded lists with Gemini-generated motion directions.

**Current:** Fixed list of ~10 actions per beat×category, randomly shuffled.
**New:** When a video frame is initialized, call Gemini with:
- Product DNA (category, sub_category, usage_type, key_features)
- Beat narrative role
- Template context
- Character info

Gemini returns 4 contextual motion suggestions like:
- "Pelan-pelan teteskan serum ke ujung jari, close-up macro"
- "Tepuk-tepuk pipi dengan gerakan lembut, POV angle"
- "Angkat botol setinggi dada, putar label ke kamera"
- "Sentuh pipi sambil senyum puas, medium shot"

These are product-specific, not generic. A laptop bag gets "buka resleting kompartemen, tunjukin isi" not "apply ke pipi."

**File:** Replace `action-chips.ts` with a `generateActionSuggestions()` function that calls Gemini via the existing key. Cache results per template+beat+category combo.

### D. Product DNA-Enriched Prompts

Enhance the Gemini system prompt to produce richer, more native-feeling outputs:

**Current prompt approach:** "Create a structured JSON prompt for a realistic product UGC photo" — generic instruction.

**New approach:** Inject deep product context into the system instruction:
```
This product is a [hyaluronic acid face serum] in a [glass dropper bottle].
Target user: [20-30 Indonesian women with dehydrated skin concerns].
Usage context: [bathroom vanity, morning skincare routine].
Emotional angle: [self-care ritual, pampering moment].

For the DEMO beat, the creator should:
- Hold the dropper above their palm, showing the clear serum consistency
- Apply 2-3 drops to fingertips, showing the lightweight texture
- Pat gently into cheeks with upward motions
- The serum should catch light to show its transparency
```

This level of specificity comes from combining Product DNA fields (category, sub_category, usage_type, material, packaging_type, key_features) with template beat context.

## Files to Change

| File | Change |
|------|--------|
| `src/lib/storyboard-angles.ts` | Replace rigid 5-role system with per-template narrative stages; change `storyRole` to flexible string |
| `src/lib/content-templates.ts` | Add narrative stage definitions per template; remove forced timing alignment |
| `src/lib/action-chips.ts` | Replace hardcoded lists with `generateActionSuggestions()` using Gemini |
| `src/pages/GeneratePage.tsx` | Reorder UI: template selection before scene settings; single "Generate Storyboard" flow; remove separate base image step |
| `src/pages/VideoPage.tsx` | Use dynamic motion suggestions instead of static chips |
| `src/lib/product-dna.ts` | Add `getProductContext()` helper that generates rich usage/emotional context from DNA fields |
| `src/lib/frame-lock-prompt.ts` | Update to accept flexible narrative roles instead of fixed module types |

## Implementation Order

1. Restructure `storyboard-angles.ts` with per-template narratives
2. Update `content-templates.ts` to match
3. Refactor `GeneratePage.tsx` UI flow (template-first, single generate action)
4. Replace `action-chips.ts` with dynamic Gemini-powered suggestions
5. Enrich prompt system with deep product context
6. Update `VideoPage.tsx` to use new dynamic suggestions
7. Update `frame-lock-prompt.ts` for flexible narrative roles

