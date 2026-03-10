
Goal: Comprehensive codebase audit — fix bugs, compress prompts, optimize performance.

## Completed Changes

### 1. Cancel Buttons Fixed (VideoPage)
- Added `frameCancelRef` threaded through `generateVideoAndWait` so individual frame and batch generation can be properly cancelled.
- Both `frameCancelRef.current` and `batchCancelRef.current` are checked during polling.

### 2. Prompt Compression (~400+ tokens saved per generation)
- Removed doubled SKIN_BLOCK, ENV_REALISM_BLOCK, UGC_STYLE_BLOCK, QUALITY_BLOCK from final prompt appending in GeneratePage (Gemini already includes these in its output).
- Only NEGATIVE_BLOCK is kept as a post-append since it's for the image generator, not Gemini.
- Compressed storyboard per-beat rules from ~600 words of full block text to ~100 words of inline guidance.
- Consolidated FRAME_LOCK_SYSTEM from ~500 words (4 separate "MANDATORY" sections) to ~200 words in one "Visual Consistency" block.

### 3. Storyboard Prompts Exposed
- Added `prompt` field to `ShotStatus` interface.
- Store actual generated `beatPrompt` in ShotStatus on completion.
- Save real prompt (not just label) to `generations` table.
- Added "Copy Prompt" button on hover for completed storyboard frames.

### 4. Gemini Timeout Increased
- Changed default from 30s → 60s in `gemini-fetch.ts`.

### 5. Landing Page Performance
- Lazy-loaded `DepthDeckCarousel` via `React.lazy()` + `Suspense`.
- Replaced `useState`-based scroll listener with `useRef` + `requestAnimationFrame` for zero-rerender parallax.
- Reduced carousel videos from 9 → 5 to cut initial load.

### 6. Shared Code Extracted
- Created `src/hooks/useCustomCharacters.ts` — eliminates duplicated character fetch logic.
- Updated `CharactersPage` to use the shared hook.
- Replaced inline FileReader base64 conversion in VideoPage with shared `fileToBase64` from `image-utils.ts`.

### 7. Preset Character URLs
- Verified old project URLs (`hgwojnluqkrypwttytxb`) are public buckets and still accessible — no change needed.

## Files Changed
- `src/pages/VideoPage.tsx` — cancel ref fix, base64 dedup, import cleanup
- `src/pages/GeneratePage.tsx` — prompt compression, storyboard prompt storage, UI prompt visibility
- `src/lib/frame-lock-prompt.ts` — compressed FRAME_LOCK_SYSTEM
- `src/lib/gemini-fetch.ts` — timeout 30s → 60s
- `src/components/HeroSection.tsx` — lazy carousel, RAF scroll
- `src/components/DepthDeckCarousel.tsx` — reduced to 5 videos
- `src/pages/CharactersPage.tsx` — uses shared useCustomCharacters hook
- `src/hooks/useCustomCharacters.ts` — new shared hook
