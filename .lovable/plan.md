

# Comprehensive Codebase & System Review

## 1. Code Quality & Logic Issues

### A. Duplicated Code (High Impact)
- **Character fetching logic** is duplicated identically in `GeneratePage.tsx` (lines 257-286) and `CharactersPage.tsx` (lines 21-50). Both map DB rows to `CharacterData` with the same field mapping. Extract into a shared hook like `useCustomCharacters()`.
- **Kie AI image polling** is implemented twice: once in `GeneratePage.tsx` (`generateKieImage`, lines 87-149) and again in `kie-video-generation.ts`. The image version is a local function with identical polling logic. Should be consolidated into the shared module.
- **File-to-base64 conversion** pattern (FileReader → split data URL) appears inline in `VideoPage.tsx` (lines 588-598) but a utility already exists in `image-utils.ts`.

### B. Potential Bugs
- **Cancel button in VideoPage single-frame generation** passes `() => false` as the cancel check (line 812), meaning individual frame generation cannot actually be cancelled. Should use a per-frame cancel ref.
- **Cancel button for storyboard (GeneratePage)** sets `storyboardAbortRef.current = true` but does NOT stop the in-flight Kie AI polling — the polling will continue until its next iteration checks the abort flag, which can take up to 3 seconds.
- **Cancel in batch generation (VideoPage)** sets `batchCancelRef.current = true` but the currently-generating frame will still complete since `generateFrame` passes `() => false` as the cancel callback.
- **Preset characters "not showing"**: Presets use hardcoded URLs pointing to `hgwojnluqkrypwttytxb.supabase.co` (old Supabase project) — NOT `uxrxrsdasgvygoeavozp` (current Lovable Cloud project). The images will 404 in the current environment. This is why preset characters appear broken.
- **`DepthDeckCarousel` also hardcodes the old project URL** (`hgwojnluqkrypwttytxb`) for showcase videos (line 4). Same 404 issue.

### C. Performance Issues
- **GeneratePage & VideoPage are "keep-alive"** via `DashboardLayout` — they mount on first visit and never unmount. This means all their state, event listeners, and timers persist even when the user navigates away. Two 1500+ line components staying mounted is a memory concern.
- **Scroll listener on landing page** (`HeroSection`) uses `useState` for parallax, causing re-renders on every scroll event. Should use `useRef` + `requestAnimationFrame` or CSS `transform` with `will-change`.

### D. File Size
- `GeneratePage.tsx` (1517 lines) and `VideoPage.tsx` (1643 lines) are extremely large monolithic components. Both would benefit from splitting into sub-components (form panel, result panel, storyboard section).

---

## 2. Prompting System Review (Critical)

### A. Massive Redundancy in Prompts
The prompting system has severe instruction repetition across layers:

1. **SKIN_BLOCK, QUALITY_BLOCK, NEGATIVE_BLOCK, ENV_REALISM_BLOCK, UGC_STYLE_BLOCK** are defined in `GeneratePage.tsx` (lines 78-82) — each is ~50-100 words.
2. These SAME blocks are appended to the final prompt (line 593): `${parsed.final_prompt}\n\n${SKIN_BLOCK}\n\n${ENV_REALISM_BLOCK}\n\n${UGC_STYLE_BLOCK}\n\n${QUALITY_BLOCK}\n\n${NEGATIVE_BLOCK}`
3. BUT the Gemini system prompt (lines 535-563) already instructs Gemini to include UGC style, environment realism, quality, and camera direction in the `final_prompt` output.
4. Result: **the final prompt sent to Kie AI contains doubled instructions** — Gemini writes UGC/realism/quality guidance into `final_prompt`, then the same instructions are appended again as raw blocks.

**Token waste estimate**: ~300-400 extra tokens per image generation call.

5. In storyboard generation (lines 756-789), the FULL text of SKIN_BLOCK, UGC_STYLE_BLOCK, QUALITY_BLOCK, and NEGATIVE_BLOCK are injected into the Gemini prompt as "RULES" — these are instructions for the *image generator*, not for Gemini. Gemini doesn't need to see the negative prompt text.

### B. `FRAME_LOCK_SYSTEM` prompt (frame-lock-prompt.ts)
- **~500 words** of system instruction, much of it repetitive:
  - "MANDATORY — ZERO TOLERANCE" sections repeat the same concept (visual consistency) in 4 separate blocks: Frame Lock, Frame Stability, Environment Lock, Lighting Stability.
  - These could be compressed to ~200 words with a single "Visual Consistency" block.
- The `buildVideoDirectorInstruction` function stacks the full system prompt + length guidance + shot context + continuity section + character section + environment section + template section. For a Veo Quality shot, this can exceed **800 words** of system instruction before the user's actual scene content.

### C. Storyboard Prompt (GeneratePage lines 756-789)
- Each beat prompt sent to Gemini includes:
  - Full `consistencyLock` block (~80 words)
  - Full Product DNA block (~60 words)
  - Full `consistencyBlock` (~80 words)
  - Full SKIN_BLOCK (~70 words)
  - Full UGC_STYLE_BLOCK (~70 words)
  - Full QUALITY_BLOCK (~40 words)
  - Full NEGATIVE_BLOCK (~100 words)
  - Plus the base image as inlineData
- **Total per-beat prompt: ~600-800 words of boilerplate** before the actual beat instruction.
- These blocks are identical across all 5 beats — they should be in the system instruction once, not repeated per-content call.

### D. Recommendations to Compress Prompts

| Area | Current | Proposed | Savings |
|------|---------|----------|---------|
| Realism blocks in final prompt | ~400 tokens appended | Move to Gemini instruction only | ~400 tokens/gen |
| FRAME_LOCK_SYSTEM | ~500 words | Consolidate to ~200 words | ~300 tokens/video |
| Storyboard per-beat boilerplate | ~600 words repeated x5 | System instruction once | ~2400 tokens total |
| NEGATIVE_BLOCK in Gemini calls | ~100 words (irrelevant to Gemini) | Remove from Gemini, keep for image gen only | ~100 tokens/call |

---

## 3. Specific Functional Issues

### Cancel Button
- **GeneratePage single image**: Works — `abortRef.current = true` is checked in the polling loop.
- **GeneratePage storyboard**: Partially works — sets flag but current in-flight API call completes.
- **VideoPage single frame**: **Broken** — `() => false` hardcoded as cancel check (line 812).
- **VideoPage batch**: Partially works — stops loop but current frame completes.
- **MultiShotCreator**: Works — `cancelRef.current` is properly threaded through.

**Fix**: Pass a real cancel ref to `generateVideoAndWait` in VideoPage's `generateFrame` function.

### Preset Characters Not Showing
**Root cause identified**: All preset character `hero_image_url` values point to `hgwojnluqkrypwttytxb.supabase.co` (the old/external Supabase project). The current project uses `uxrxrsdasgvygoeavozp`. The images are hosted on the old project's storage and may not be accessible. Either:
- Upload preset images to the current project's storage and update URLs, OR
- Verify the old project's storage bucket is publicly accessible (it may be, since these are public URLs)

The preset *data* loads fine from the hardcoded `PRESETS` array — the issue is likely image 404s, not missing data.

### Storyboard Prompts Visibility
Currently, storyboard beat prompts are generated inside `generateSingleBeat` (line 793) but only used transiently — they are NOT stored in `shotStatuses` or exposed to the UI. The `generations` table insert stores only `Storyboard: ${beat.label}` as the prompt (line 833), not the actual generated prompt.

**Fix**: Add a `prompt` field to the `ShotStatus` interface and store the generated `beatPrompt` alongside the result.

### Landing Page Loading
- The `DepthDeckCarousel` loads **9 video files** on mount (lines 13-22), all from remote storage. Each video uses `preload="metadata"` which is reasonable, but 9 concurrent video element initializations can still cause noticeable loading.
- The `AnimatedBackground` component with 5 blur-3xl animated orbs adds GPU load.
- No lazy loading — all landing page sections render immediately.

**Fix**: Lazy-load the carousel (IntersectionObserver or dynamic import), reduce video count to 5, and use `loading="lazy"` on below-fold images.

### Image Generation Timeout
- `gemini-fetch.ts` has a **30-second timeout** — this is likely the bottleneck.
- When Gemini receives a large prompt (600-800 words + base64 image), processing can exceed 30s, especially with `gemini-2.5-pro`.
- The Kie AI polling has a generous 80-poll (240s) timeout, so that's not the issue.
- **Primary fix**: Increase `geminiFetch` timeout to 60s for image-related calls, and compress prompts as described above.
- **Secondary**: The prompt being sent to Kie AI (with all blocks appended) can be 800+ words. Kie AI's `nano-banana-pro` model may have its own prompt length limits. Compressing the prompt would help here too.

---

## Implementation Plan (Prioritized)

1. **Fix preset character image URLs** — update `character-presets.ts` to point to current project storage (or verify old URLs work)
2. **Fix cancel buttons** — thread cancel refs through VideoPage `generateFrame`
3. **Compress prompts** — remove doubled realism blocks, consolidate FRAME_LOCK, move boilerplate to system instructions
4. **Expose storyboard prompts** — add prompt field to ShotStatus, store actual prompt in DB
5. **Increase Gemini timeout** — 60s for image/storyboard calls
6. **Landing page perf** — lazy-load carousel, reduce video count
7. **Extract shared code** — `useCustomCharacters` hook, consolidate Kie AI polling

