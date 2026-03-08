

## Plan: Improve Image Generation Timeout Resilience

The timeout at 50 polls x 3s = 2.5 minutes is tight for Kie AI under load. Two small improvements:

### Changes to `src/pages/GeneratePage.tsx`

1. **Increase maxPolls from 50 to 80** — gives ~4 minutes instead of 2.5 minutes, matching the reality that `nano-banana-pro` can take 3-4 minutes under load
2. **Add 404 retry tolerance** (like `kie-video-generation.ts` already does) — if a poll returns 404, retry instead of crashing
3. **Show elapsed time in the loading UI** so users know it's still working (e.g., "Generating... 45s")

### Single file change
- `src/pages/GeneratePage.tsx` — update poll logic (maxPolls, 404 handling, elapsed timer in loading state)

