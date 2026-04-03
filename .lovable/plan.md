

## Plan: 2 Changes

### 1. Move preset character images to external Supabase storage

The 10 preset character images currently live in `public/assets/characters/` (~34MB of JPEGs). Point them to your existing Supabase storage bucket instead.

**`src/lib/character-presets.ts`**:
- Change all `hero_image_url` values from `/assets/characters/<name>.jpeg` to `https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/<name>.jpeg`
- The filenames should match what's in your bucket (hijab-casual.jpeg, urban-trendy.jpeg, etc.)

**Delete local files**: Remove all `.jpeg` files from `public/assets/characters/` to save ~34MB from the project bundle.

### 2. Fix price simulation to show correct monthly totals

The "Simulasi Biaya Bulanan" section currently shows **daily** totals (e.g. Rp 26.400) but labels them as "/bulan". Two fixes needed:

**`src/components/ApiCostSection.tsx`**:

| Card | Current `total` (daily) | Correct `total` (×30) |
|------|------------------------|----------------------|
| Content Creator | 26,400 | 792,000 |
| Brand / Agency | 79,200 | 2,376,000 |
| Hemat Mode | 18,240 | 547,200 |

- Update each `total` field to be the monthly value (daily × 30)
- Update `calc` strings to show the monthly math, e.g.: `"(5 × Rp 1.440) + (3 × Rp 6.400) = Rp 26.400/hari × 30 = Rp 792.000/bulan"`
- Keep the `/bulan` suffix on the animated number display (line 387)
- Update the `vs` comparison strings to reflect monthly comparisons

### Technical Notes
- The external Supabase bucket `preset-characters` on project `hgwojnluqkrypwttytxb` is public, so no auth needed for image URLs
- If any filenames in the bucket differ from the current naming convention, we may need to adjust — will verify during implementation

