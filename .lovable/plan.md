

## Plan: Optimize Video Setup Layout — Use Full Width

### Problem
The setup screen uses `max-w-2xl mx-auto` (max 672px centered), wasting significant horizontal space on typical dashboard screens.

### Solution
Convert to a **2-column layout** on larger screens:

**Left column (~45%):** Source Image upload + Product Detection banner + Aspect Ratio selector
**Right column (~55%):** Template Konten grid + Storyboard Preview

**Plan Storyboard button** spans full width below both columns.

### Changes — `src/pages/VideoPage.tsx`

1. **Remove** `max-w-2xl mx-auto` from the outer container
2. **Wrap** the content sections in a `grid grid-cols-1 lg:grid-cols-2 gap-6` layout
3. **Left column**: Source Image + Product Detection + Aspect Ratio (stacked vertically)
4. **Right column**: Template Konten + Storyboard Preview (stacked vertically)
5. **CTA button** stays outside the grid, full width below

This keeps mobile layout unchanged (single column) while utilizing the full dashboard width on desktop.

