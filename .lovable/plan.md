

## Plan: Add Veo HD Upgrades + Sora 2 Models + Image Upscale on Storyboard

Three features in one pass, plus a note on image quality.

---

### Feature 1: Veo 1080p / 4K Upgrade Buttons

**Files to edit:** `src/lib/kie-video-generation.ts`, `src/pages/VideoPage.tsx`

**kie-video-generation.ts:**
- Change `generateVideoAndWait` to return `{ videoUrl, taskId }` instead of just `{ videoUrl }` — expose the taskId for HD requests
- Add `fetchHDVideo(taskId, apiKey, resolution, isCancelled?)` function:
  - **1080p**: GET `/veo/get-1080p-video?taskId={taskId}&index=0`, poll every 20s until `code === 200` with `data.resultUrl`, timeout 3 min
  - **4K**: POST `/veo/get-4k-video` with `{ taskId, index: 0 }`, then poll `/veo/record-info` every 30s until result, timeout 10 min

**VideoPage.tsx:**
- Add `taskId` field to `FrameState` interface (string | null, default null)
- Add `hdLoading` field to `FrameState` (`"1080p" | "4k" | null`)
- Store taskId when generation completes: `updateFrame(idx, { status: "completed", videoUrl: result.videoUrl, taskId: result.taskId })`
- In the completed frame UI (lines ~1851-1870), add two buttons after Download/Retry row:
  - Only visible when `frame.model` starts with `veo_`
  - "1080p" button — calls `fetchHDVideo` directly, swaps videoUrl on success
  - "4K" button — shows AlertDialog confirmation first (warns about extra credits ~Rp 12.800), then calls fetchHDVideo
  - Each shows Loader2 spinner while loading, disabled during fetch

### Feature 2: Sora 2 Models

**Files to edit:** `src/lib/kie-video-generation.ts`, `src/lib/frame-lock-prompt.ts`, `src/pages/VideoPage.tsx`, `src/pages/DashboardHome.tsx`

**kie-video-generation.ts:**
- Extend `VideoModel` type: add `"sora2" | "sora2_pro"`
- Add timeouts: sora2 → 300_000, sora2_pro → 600_000; poll intervals: both 5_000
- Add `createTask` branch for Sora 2:
  - Model strings: `"sora-2-image-to-video"` / `"sora-2-pro-image-to-video"`
  - Convert aspectRatio: `"9:16"` → `"portrait"`, `"16:9"` → `"landscape"`, else `"square"`
  - Body: `{ model, input: { prompt, image_urls, aspect_ratio, n_frames: "10", remove_watermark: true, upload_method: "s3" } }`
  - Uses `/jobs/createTask` endpoint (same as Kling/Grok)
- Polling: already handled by the non-Veo path — no changes needed
- `normalizeDurationForModel`: Sora 2 returns duration as-is (fixed ~10s from n_frames)

**frame-lock-prompt.ts:**
- Add `"sora2"` and `"sora2_pro"` to `VideoModelType`
- Add MODEL_FORMAT_GUIDANCE entries — flowing natural paragraph style (like Grok)

**VideoPage.tsx:**
- Add to `VideoModel` type, `MODEL_COSTS` (sora2: 3200, sora2_pro: 6400 — estimate), `MODEL_LABELS`, `MODEL_DURATIONS`
- Add to model selector pills in the frame editor
- HD upgrade buttons: only show for `veo_fast` / `veo_quality` (not sora2)

**DashboardHome.tsx:**
- Add `sora2` and `sora2_pro` entries to `MODEL_COST` map

### Feature 3: Image Upscale on Storyboard Frames

**Files to edit:** `src/pages/VideoPage.tsx`

- Import `useUpscale` hook and `UpscaleButton` component (both already exist)
- In each frame's source image section, add an UpscaleButton next to the image
- When upscale completes, update `frame.sourceImageUrl` with the upscaled URL
- Only show when frame has a sourceImageUrl and status is not "generating"

### Re: Image Quality Question

The quality difference between character storyboard and image storyboard is likely due to the prompt structure — character pages include detailed identity context (face, skin, hair, body) that grounds the generation, while image storyboard may send more generic prompts. This is a prompt engineering issue, not a model issue. No code changes needed for this — it's worth investigating the actual prompts being sent via console logs.

---

### Technical Details

**Modified files:**
1. `src/lib/kie-video-generation.ts` — new `fetchHDVideo` export, Sora 2 in createTask, extended VideoModel type, return taskId from generateVideoAndWait
2. `src/lib/frame-lock-prompt.ts` — add sora2/sora2_pro to VideoModelType and MODEL_FORMAT_GUIDANCE
3. `src/pages/VideoPage.tsx` — FrameState gains `taskId` + `hdLoading`, HD buttons UI, Sora 2 in model selector/costs/labels/durations, UpscaleButton on source images
4. `src/pages/DashboardHome.tsx` — add sora2 cost entries

