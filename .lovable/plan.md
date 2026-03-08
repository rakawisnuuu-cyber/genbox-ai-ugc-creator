

## Problem

The "Cara Kerja" section has images getting cropped due to:
1. **Step 1 & 3**: Fixed `h-32` (128px) height on image containers — too short for the product/UGC photos
2. **Step 2**: Character avatars are only `h-12 w-12` (48px) — too small to see faces clearly

## Plan

### Increase image container heights
- Step 1 (Upload): Change `h-32` → `h-48` (192px) to show more of the headphone product image
- Step 3 (Generate): Change `h-32` → `h-48` (192px) to show more of the UGC result image

### Enlarge character avatars
- Step 2 (Characters): Change avatar size from `h-12 w-12` → `h-16 w-16` and add some vertical padding so the card height matches the other two steps

### Ensure consistent card heights
- Add `min-h` or `aspect-ratio` considerations so all three cards look balanced across the grid

**Files to edit**: `src/components/CaraKerjaSection.tsx` (lines 34, 59, 70)

