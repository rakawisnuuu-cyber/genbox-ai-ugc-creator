

## Plan: 7 Changes

### 1. Hero Section — Replace static carousel with YouTube Shorts embeds
**File**: `src/components/DepthDeckCarousel.tsx`
- Replace the static `.webp` image cards with YouTube Shorts embeds
- Each card renders a YouTube thumbnail by default; the active card loads an iframe (`youtube.com/embed/VIDEO_ID?autoplay=1&mute=1&loop=1&playlist=VIDEO_ID&controls=0`)
- Start with `2eu2OX_py3c`; keep array extensible for more IDs
- Keep existing drag/swipe nav, dots, and spring animations
- Delete the 5 showcase `.webp` files from `public/assets/images/showcase/` (video-1 through video-6) after migration

### 2. Fix broken character images in FiturSection & CaraKerjaSection
**Files**: `src/components/FiturSection.tsx` (lines 11-21), `src/components/CaraKerjaSection.tsx` (lines 7-14)
- Change all `/assets/characters/X.jpeg` paths to `https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/X.jpeg`

### 3. Fitur Section layout + replace Fitur 03 asset
**File**: `src/components/FiturSection.tsx`
- Change layout: Feature 01 as full-width hero card, Features 02 & 03 side-by-side in a 2-column grid on desktop
- Replace Fitur 03 image (`/assets/images/showcase/fitur-03-video.webp`) with `https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/showcase-videos/Fitur-03-image.png`
- Remove `CharacterStack` and `BeforeAfterReveal` interactive components (screenshots already demo the features)
- Delete `fitur-03-video.webp` and `fitur-video.webp` from `public/assets/images/showcase/`

### 4. Harga Section — horizontal layout on desktop
**File**: `src/components/HargaSection.tsx`
- Desktop: 2-column grid — left side: headline, subheadline, trust items, value prop; right side: pricing card
- Mobile: stacked vertically as-is

### 5. Image Generation Engine — Lean Prompt System Refactor
**File**: `src/lib/image-generation-engine.ts`
- Remove constants: `UGC_BEHAVIOR_BLOCK`, `AFFILIATE_PRIORITY_BLOCK`, `FIRST_FRAME_RULE`, `SINGLE_IMAGE_RULE`, `GLOBAL_DEVICE_RULE`, `ANTI_GLITCH_BLOCK`, `UGC_REALISM`, `COMMERCIAL_REALISM`
- Add `LEAN_SYSTEM_BASE(mode)`, new `NEGATIVE_BLOCK`, updated `REALISM_BOOST`
- Replace `CATEGORY_SHOT_ACTIONS` with leaner version (shorter per-shot actions)
- Replace `planImageShots` function with lean version that assembles: system block → realism boost → shot action → character → camera → lighting → environment → product block → consistency → negative
- Remove unused imports/constants (`CATEGORY_DETAILS`, `SKIN_TONES`, `getProductContext` import)
- Keep `SHOT_TYPES`, `estimateCost`, `formatRupiah`, all type exports unchanged

### 6. Add new nav items: Script Engine (coming soon) + E-Course
**File**: `src/components/DashboardLayout.tsx`
- Add `Script Engine` to TOOLS with `MessageSquare` icon, path `/tools/script-engine`, added to `COMING_SOON_PREFIXES`
- Add `E-Course` to TOOLS with `GraduationCap` icon, path `/ecourse`

**New file**: `src/pages/ECoursePage.tsx`
- Simple page with embedded YouTube video card for `https://youtu.be/8IsXX7qvAkk`
- Extensible list for future tutorials

**File**: `src/App.tsx`
- Add route `/ecourse` → `<ECoursePage />`

### 7. Delete unused files
| File | Reason |
|------|--------|
| `src/lib/video-modules.ts` | Zero imports anywhere |
| `src/assets/cara-kerja-ugc.jpeg` | Replaced by `cara-kerja-ugc-new.jpeg`, zero imports |
| `public/blueprints/ugc-studio-merge.json` | Old v1, replaced by v3, zero references |
| `public/assets/images/showcase/fitur-03-video.webp` | Replaced by Supabase URL (step 3) |
| `public/assets/images/showcase/fitur-video.webp` | Only used in FiturSection animation being removed |
| `public/assets/images/showcase/video-1.webp` through `video-6.webp` | Replaced by YouTube embeds (step 1) |

**NOT deleting** (still imported):
- `src/lib/image-to-video-prompts.ts` — imported by `GeneratePage.tsx`
- `src/lib/character-vibes.ts` — imported by `CreateCharacterPage.tsx`

