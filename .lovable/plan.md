

# Fix Veo Video Generation Failures

## Root Cause Analysis

After reviewing the Kie.ai API docs and the polling code in `src/lib/kie-video-generation.ts`, I found **three issues**:

1. **Missing `successFlag === 2` handling** — The docs define 4 status codes: `0` (generating), `1` (success), `2` (failed), `3` (generation failed). The current code only checks for `1` and `3`, meaning if the API returns `successFlag: 2`, the code **polls forever** until timeout instead of failing fast.

2. **Error message not extracted** — When `successFlag` is 2 or 3, the API returns `errorMessage` and `errorCode` fields, but the code uses `extractError(j.data, "Veo generation failed")` which looks for `msg/message/error` — missing the actual `errorMessage` field from the response.

3. **Wrong `generationType` for single-image reference** — The code always sends `FIRST_AND_LAST_FRAMES_2_VIDEO`, which treats the image as a literal first frame to transition from. For character-reference-based generation, `REFERENCE_2_VIDEO` (available for Fast model) is more appropriate, and when no images are provided, `TEXT_2_VIDEO` should be used.

## Changes

### 1. `src/lib/kie-video-generation.ts`

**Polling — handle all status codes:**
- Add `flag === 2` as a failure condition alongside `flag === 3`
- Extract `j.data?.errorMessage` for better error reporting
- Log the raw `successFlag` value for debugging

**Task creation — smart `generationType`:**
- No images → `TEXT_2_VIDEO`
- 1 image + Fast model → `REFERENCE_2_VIDEO` (treats as reference material, not literal first frame)
- 1 image + Quality model → `FIRST_AND_LAST_FRAMES_2_VIDEO` (REFERENCE not supported on Quality)
- 2 images → `FIRST_AND_LAST_FRAMES_2_VIDEO`

### 2. `src/pages/VideoPage.tsx`

- Display the actual API error message (from `errorMessage` field) in the frame error UI instead of generic "Veo generation failed"

