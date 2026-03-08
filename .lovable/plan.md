

## Enforce Strict Visual Consistency Across Both Video Flows

### Problem
Generated videos drift from the reference/start image — environment changes, face reshaping, lighting shifts, outfit inconsistencies. Two root causes:
1. **Veo Fast uses `REFERENCE_2_VIDEO`** for single-image input — treats image as loose style reference, not strict first frame
2. **Prompts lack explicit "do NOT" constraints** — current Frame Lock instructions say what to match but don't explicitly forbid common drift behaviors (face beautification, skin smoothing, hair shifts, environment reinterpretation)

### Changes

#### 1. `src/lib/kie-video-generation.ts` — Fix generationType (line 95)
Change Veo Fast single-image from `REFERENCE_2_VIDEO` → `FIRST_AND_LAST_FRAMES_2_VIDEO` to enforce strict first-frame locking.

#### 2. `src/lib/frame-lock-prompt.ts` — Strengthen system prompt + add environment lock
Replace the current `FRAME_LOCK_SYSTEM` with stronger rules:

- **FRAME LOCK section**: Add explicit "NO visual reinterpretation allowed" emphasis, add expression style lock
- **New FRAME STABILITY section**: Add explicit "Do NOT allow" list:
  - Face reshaping or beautification
  - Skin smoothing or texture loss
  - Hair volume or color shift
  - Makeup intensity changes
  - Eye color, lip shape, nose structure must be locked
- **New ENVIRONMENT LOCK section**: Explicitly forbid changing wall colors, surfaces, props, furniture, materials — environment must be identical from frame 1 to end
- **LIGHTING STABILITY**: Add "No auto-exposure shifts, no white balance changes" emphasis
- **Add `environmentDescription` optional param** to `buildVideoDirectorInstruction` — when provided, inject concrete environment description as mandatory anchor
- **Strengthen continuity section** for shots after first: re-state full lock rules, not just "same outfit, same appearance"

#### 3. `src/pages/VideoPage.tsx` — Extract environment description during planning
- In `planStoryboard` (~line 412): Add `"environment"` field to the JSON schema requested from Gemini — detailed description of setting, background, props, surfaces, wall colors, materials, lighting from the reference image
- Store in new `environmentDesc` state
- In `generateFramePrompt` (~line 686-734): Pass `environmentDescription` to `buildVideoDirectorInstruction` and inject into content text as `"ENVIRONMENT (DO NOT CHANGE): ${environmentDesc}"`

#### 4. `src/hooks/useMultiShotGeneration.ts` — Pass environment description
- Add `environmentDescription` optional field to `UseMultiShotGenerationOptions`
- Pass it through to `buildVideoDirectorInstruction` in `enhanceModulePrompt`

#### 5. `src/components/video/MultiShotCreator.tsx` — Extract environment for multi-shot
- When character hero image is available + Gemini key valid, auto-extract environment description on step 2 entry (one Gemini call to describe the setting)
- Store in local state, pass to `useMultiShotGeneration`

### Files changed
| File | Change |
|---|---|
| `src/lib/kie-video-generation.ts` | Line 95: `REFERENCE_2_VIDEO` → `FIRST_AND_LAST_FRAMES_2_VIDEO` |
| `src/lib/frame-lock-prompt.ts` | Rewrite FRAME_LOCK_SYSTEM with strict "Do NOT" rules + environment lock + new `environmentDescription` param |
| `src/pages/VideoPage.tsx` | Extract `environment` from planStoryboard, inject into generateFramePrompt |
| `src/hooks/useMultiShotGeneration.ts` | Accept + pass `environmentDescription` |
| `src/components/video/MultiShotCreator.tsx` | Auto-extract environment description, pass to hook |

