

## Fitur Section — Numbered Timeline Layout

Redesign the `FeatureRow` component and section layout to use a vertical timeline style.

### Layout Structure

```text
         Timeline
            │
   ┌────────┼────────────────────┐
   │  01    │   [Visual]         │
   │  Title │                    │
   │  Desc  │                    │
   │        ●────────            │
   │        │                    │
   │  [Visual]    02             │
   │              Title          │
   │        ●──── Desc           │
   │        │                    │
   │  03    │   [Visual]         │
   │  Title │                    │
   │  Desc  ●────────            │
   └────────┼────────────────────┘
            │
```

### Changes to `src/components/FiturSection.tsx`

1. **Replace `space-y` container** with a `relative` container that has a vertical line (`absolute left-1/2 w-px bg-border/40`) running down the center on desktop, and `left-[20px]` on mobile.

2. **Redesign `FeatureRow`**:
   - Each row is a `relative` flex container with the timeline dot (a small `w-3 h-3 rounded-full bg-primary` circle with a subtle glow) positioned on the vertical line.
   - Text side (number + title + desc) and visual side alternate left/right based on `reversed`.
   - On mobile: timeline line shifts to the left edge, all content flows to the right in a single column.

3. **Number styling**: Keep `font-mono text-[48px] font-bold text-primary` but position it as part of the text block, not floating.

4. **Timeline dot**: Each feature gets a dot on the line with a subtle `ring-4 ring-primary/10` glow effect.

5. **Spacing**: `py-12` between each feature row for breathing room.

### Mobile Behavior
- Vertical line at `left-[20px]` with dots aligned to it.
- All text + visuals stack vertically to the right of the line.
- Alternating layout only applies on `lg:` breakpoint and above.

