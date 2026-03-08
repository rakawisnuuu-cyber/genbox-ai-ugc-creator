
Goal: fix multi-shot generation failures and make model behavior consistent by reusing one shared generation/polling path across quick + multi-shot.

1) Root cause found (current failing run)
- The failing multi-shot run is not primarily a polling bug.
- Network responses show Grok task creation returns:
  - `{"code":500,"msg":"duration is not within the range of allowed options"}`
- Multi-shot currently sends module durations like 2/3/4/7s to Grok.
- Grok image-to-video accepts limited duration values (6 or 10), so creation fails before polling.
- Error display is misleading because code reads `message` but API returns `msg`, so user sees generic “Failed to create Grok task”.

2) Implementation plan (what to build)
- Create a shared video generation client (single source of truth) used by:
  - `src/pages/VideoPage.tsx` (quick mode)
  - `src/hooks/useMultiShotGeneration.ts` (multi-shot mode)
- Move all Kie logic into shared functions:
  - task creation payload by model (Grok / Veo Fast / Veo Quality)
  - polling endpoint + status parsing
  - timeout + retry policy (including 404 retry cap)
  - consistent URL extraction from result payloads
  - consistent API error extraction (`msg || message || code`)
- Remove duplicated inline generation logic from both call sites.

3) Grok duration compatibility fix (critical)
- Add duration normalization for Grok before createTask:
  - map to allowed values only (6 or 10)
  - recommended mapping: `<8 => 6`, `>=8 => 10`
- Apply this in shared generator so both quick and multi-shot stay valid.
- In Step 2 module editor, add Grok-specific UX guard:
  - when model is Grok, show helper text “Durasi Grok hanya 6/10 detik”
  - prevent silently invalid durations (either enforce picker options or show normalized final value per shot).

4) Polling/404 hardening
- Keep Veo polling on `/api/v1/veo/record-info?taskId=...` and Grok on `/api/v1/jobs/recordInfo?taskId=...` in shared client.
- Add explicit debug logs in shared poller:
  - model, taskId, poll URL, HTTP status, parsed state
- Stop polling after 5 consecutive 404s with clear actionable error.
- Keep model-specific timeout windows:
  - Grok 3m, Veo Fast 5m, Veo Quality 10m.

5) Multi-shot integration details
- `generateSingleShot` in `useMultiShotGeneration.ts` becomes a thin wrapper:
  - build image inputs + continuity image references
  - call shared `generateVideoAndWait(...)`
- Keep existing sequential behavior (continue next shot on failure).
- Preserve shot-level retry/regenerate flow and status updates (no UX regression).

6) Check “other modules” / regressions
- Verify no breakage in:
  - Quick video generation (`/video` quick mode)
  - Multi-shot initial run
  - Shot regenerate + “Save & Regenerate”
  - Model switching between Grok / Veo Fast / Veo Quality
  - Module insert/delete/reorder path still updates and generates correctly
- Validate error toasts now show real provider messages (e.g., invalid duration).

Technical details (concise)
- New shared file (example): `src/lib/kie-video-generation.ts`
- Exposed API (example):
  - `normalizeDurationForModel(model, duration)`
  - `createVideoTask(params)`
  - `pollVideoTask(params)`
  - `generateVideoAndWait(params)` (used by both quick + multi-shot)
- Parsing rules:
  - Grok success: `jobs/recordInfo` + `data.state === "success"` + parse `resultJson`
  - Veo success: `veo/record-info` + `data.successFlag === 1`
- Error normalization:
  - throw `msg || message || "Unknown generation error"` so UI shows true cause.

Validation matrix after implementation
- Grok multi-shot (5 shots with mixed durations): creation succeeds, no duration 500.
- Veo Fast multi-shot: no repeated 404 loop, completes with valid URL.
- Veo Quality single-shot: completes within timeout window.
- At least one failed case (intentional invalid key) returns clear message in UI.
