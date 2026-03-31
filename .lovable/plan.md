

## Implementation Plan — Frontend-Only Changes (8 tasks)

### 1. Login.tsx — Call `consume-invite-code` after successful signUp

Reorder the signup flow in `handleSignup`:
1. `validate-invite-code` (check only — already called)
2. `supabase.auth.signUp`
3. **Only if signUp succeeds** (no error), call `supabase.functions.invoke("consume-invite-code", { body: { code: inviteCode.trim() } })`
4. If consume fails, log warning but don't block — user already signed up

Move the `signUp` call **before** code consumption. Currently the flow validates then signs up — just add the consume call after signUp success.

### 2. Update Kie AI pricing

**`src/lib/image-generation-engine.ts`** — COST_PER_IMAGE:
- `nano-banana`: 640 (was 310)
- `nano-banana-2`: 640 (was 620) — 8 credits × Rp80
- `nano-banana-pro`: 1440 (was 1400) — 18 credits × Rp80

**`src/pages/GeneratePage.tsx`** — MODEL_INFO desc strings:
- nano-banana: "~Rp 640"
- nano-banana-2: "~Rp 640"
- nano-banana-pro: "~Rp 1.440"

MOTION_MODELS costs:
- grok: 320 (4 credits × Rp80)
- kling_std: 1600/s (20 credits × Rp80) — show base 5s = 8000
- kling_pro: 2160/s — show base 5s = 10800
- veo_fast: 4800 (60 credits × Rp80)
- veo_quality: 20000 (250 credits × Rp80)

TALK_VEO_MODELS costs:
- veo_fast: costBase 4800, costExtend 3600
- veo_quality: costBase 20000, costExtend 15000

**`src/pages/VideoPage.tsx`** — MODEL_COSTS, MODEL_LABELS cost strings (same values as above, remove sora entries)

**`src/pages/DashboardHome.tsx`** — MODEL_COST: update all values, remove sora entries

### 3. Remove Sora from all frontend files

**`src/pages/VideoPage.tsx`**:
- Remove `sora2 | sora2_pro` from VideoModel type
- Remove from MODEL_COSTS, MODEL_LABELS, MODEL_DURATIONS
- Remove sora branches from gallery save model mapping (lines 1055-1058)

**`src/lib/frame-lock-prompt.ts`**: Remove `sora2 | sora2_pro` from VideoModelType, remove `sora2` and `sora2_pro` entries from MODEL_FORMAT_GUIDANCE

**`src/lib/image-to-video-prompts.ts`**: Remove from VideoModelType, remove sora references in model guidance string

**`src/lib/kie-video-generation.ts`**: Remove from VideoModel type, POLL_TIMEOUT, POLL_INTERVAL, and the Sora createTask branch (lines 135-165 approx)

**`src/pages/DashboardHome.tsx`**: Remove sora entries from MODEL_COST

### 4. Fix memory leak — blob URL revocation

**`src/pages/GeneratePage.tsx`**:
- Add `const prevProdBlobRef = useRef<string | null>(null)`
- Before `setProdPreview(URL.createObjectURL(f))`, revoke previous: `if (prevProdBlobRef.current) URL.revokeObjectURL(prevProdBlobRef.current)`
- Store new URL in ref
- Add `useEffect` cleanup to revoke on unmount

**`src/pages/VideoPage.tsx`**:
- Same pattern for `sourcePreview` — add ref, revoke before setting new, cleanup on unmount
- The per-frame blob URLs (sourceImageUrl, endFrameUrl) are numerous; add a cleanup `useEffect` that revokes all blob URLs in `frames` on unmount

### 5. Fix GalleryPage.tsx pagination

- Add `const cursorRef = useRef<string | null>(null)`
- In `fetchItems`, replace `items[items.length - 1].created_at` with `cursorRef.current`
- After fetching, update `cursorRef.current = lastItem.created_at`
- On tab change (non-loadMore), reset `cursorRef.current = null`
- Change dependency array from `[user, tab, items]` to `[user, tab]`

### 6. Confirm pricing.ts — No change needed

Already `price: 99_000`, `originalPrice: 249_000`. ✓

### 7. Replace WhatsApp placeholder numbers

Replace `6281234567890` → `6287775788034` in:
- `src/components/BYOKDisclaimerModal.tsx` (line 10)
- `src/pages/TrialExpiredPage.tsx` (line 45)
- `src/pages/CheckoutSuccessPage.tsx` (line 157) — will be deleted in task 8, but replace first for safety

### 8. Delete unused files & clean App.tsx

**`src/App.tsx`**: Remove `CheckoutSuccessPage` import (line 24) and `/checkout/success` route (line 45)

**Delete files** (verified zero active external imports):
- `src/pages/CheckoutSuccessPage.tsx`
- `src/components/video/MultiShotCreator.tsx` (self-contained, no external importers)
- `src/hooks/useMultiShotGeneration.ts` (only imported by MultiShotCreator)
- `src/lib/openai-fetch.ts` (zero imports anywhere)

### Technical Notes

- **Kling per-second pricing**: Kling 3.0 charges per-second. For the VideoPage MODEL_COSTS (which are per-generation), we'll use `credits_per_sec × Rp80 × default_duration`. E.g. kling_std 5s no-audio = 14×80×5 = Rp5,600. With audio (20 credits/s) = Rp8,000. Since audio is default on, use audio rates.
- **Edge Functions are NOT modified** — validate-invite-code and consume-invite-code changes are handled separately by the user.
- The `kie-video-generation.ts` sora removal is a frontend file in `src/lib/`, so it's in scope.

