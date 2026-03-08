

## Fix FiturSection Text Layout

Looking at the screenshot, the issues are:

1. **Text alignment is inconsistent** — both non-reversed (01, 03) and reversed (02, 04) rows have `lg:text-right` on the text side, so text is always right-aligned. For reversed rows where text is on the right, this is fine. But for non-reversed rows where text is on the LEFT side, right-aligning looks awkward — it should be left-aligned to sit closer to the center timeline.

2. **Visual alignment is off** — visuals aren't centered/aligned toward the timeline. Non-reversed rows have visuals floating left instead of right-aligned toward center. Reversed rows have visuals floating right instead of left-aligned toward center.

3. **Text block on mobile** — all text is left-aligned on mobile due to `pl-12`, which is fine, but the number + title + desc could use better spacing.

### Changes to `src/components/FiturSection.tsx`

**FeatureRow component (lines 301-329):**

- **Text side alignment**: 
  - Non-reversed (text LEFT of timeline): use `lg:text-right` so text hugs the center line ✓ (already correct)
  - Reversed (text RIGHT of timeline): use `lg:text-left` instead of `lg:text-right` so text hugs the center line
  - Fix: reversed text should be `lg:text-left lg:pr-16` → change line 318

- **Visual side alignment**:
  - Non-reversed (visual RIGHT of timeline): visual should align left toward center → add `lg:ml-0`
  - Reversed (visual LEFT of timeline): visual should align right toward center → add `lg:ml-auto`
  - Fix: add flex alignment classes to visual container on line 324-325

- **Reduce gap between text and visual** from `lg:gap-16` to `lg:gap-12` for tighter composition

- **Adjust padding**: Change `lg:pr-16`/`lg:pl-16` to `lg:pr-12`/`lg:pl-12` for more balanced spacing

Concrete line changes:
- Line 316: `lg:gap-16` → `lg:gap-12`
- Line 318: For reversed, change `lg:text-right lg:pl-16` to `lg:text-left lg:pl-12`. For non-reversed, change `lg:pr-16 lg:text-right` to `lg:pr-12 lg:text-right`
- Line 324: For reversed, add `lg:flex lg:justify-end` so visual aligns right. For non-reversed, keep left-aligned.
- Line 325: Remove `max-w-sm` constraint on the wrapper, keep it on the visual container but add proper alignment

