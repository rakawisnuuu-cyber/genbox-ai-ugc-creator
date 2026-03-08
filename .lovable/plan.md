

# Full System Sanity Check — Codebase Health Report

## Overall Codebase Health Score: 6.5 / 10

The app is functional and well-featured, but has accumulated technical debt — duplicated utilities, dead code paths, unused files/variables, and monolithic page components that are hard to maintain.

---

## 1. High Priority Issues

### 1.1 Duplicated `imageUrlToBase64` — 3 separate implementations

**Files:** `src/pages/VideoPage.tsx:199`, `src/pages/GeneratePage.tsx:84`, `src/pages/CreateCharacterPage.tsx:181`

Each has a *different* signature:
- VideoPage returns `{ mimeType: string; data: string } | null`
- GeneratePage returns `string` (raw base64, no mimeType)
- CreateCharacterPage returns `string` (same as GeneratePage)

**Problem:** Maintenance risk — fixing a bug in one copy won't fix the others. The GeneratePage version also hardcodes `mimeType: "image/jpeg"` at the call site, which is wrong for PNG/WebP images.

**Fix:** Extract to `src/lib/image-utils.ts` with a single canonical implementation. All 3 files import from there. Safe — no behavior change.

### 1.2 Duplicate `protectedPaths` arrays — out of sync

**Files:** `src/App.tsx:24` and `src/contexts/AuthContext.tsx:51`

- App.tsx list: `/dashboard, /generate, /characters, /prompt, /blueprint, /video, /settings` (missing `/gallery`)
- AuthContext list: includes `/gallery`

**Problem:** The App.tsx `protectedPaths` is **unused** — it's declared but never referenced. The AuthContext list is the one that actually runs the redirect logic. Meanwhile, `/gallery` has no route in `App.tsx` at all (GalleryPage is never imported or routed).

**Fix:** Remove unused `protectedPaths` from App.tsx. Either add a `/gallery` route or remove it from AuthContext's list.

### 1.3 GalleryPage is orphaned — no route, never imported

**File:** `src/pages/GalleryPage.tsx` (423 lines)

This file exists but is never imported in `App.tsx`. There is no `/gallery` route. It's completely dead code.

**Fix:** Either wire it up with a route, or delete it. Currently it's 400+ lines of unused code.

### 1.4 Security: API keys stored as plaintext in `user_api_keys`

**File:** `src/hooks/useApiKeys.ts:29` — column is `encrypted_key` but the value is stored/read as plaintext.

**Problem:** The column name `encrypted_key` is misleading — the key is upserted as raw text via the Supabase client. Anyone with RLS read access sees the raw API key.

**⚠️ Risky Optimization — Do Not Apply Without Testing:** Encrypt keys server-side via an edge function. This changes data flow significantly.

---

## 2. Medium Priority Improvements

### 2.1 Duplicated `fileToBase64` utility

**File:** `src/pages/GeneratePage.tsx:99` — only used once in that file.

Same pattern as `imageUrlToBase64`. Should be in shared utils.

### 2.2 `gemini-fetch.ts` ignores `timeoutMs` parameter

**File:** `src/lib/gemini-fetch.ts:14`

```ts
export async function geminiFetch(
  model: string, apiKey: string, body: Record<string, any>,
  timeoutMs: number = GEMINI_TIMEOUT_MS,  // ← parameter accepted
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS); // ← but constant used
```

The function accepts `timeoutMs` but always uses the constant `GEMINI_TIMEOUT_MS`. The parameter is dead.

**Fix:** Change line 14 to `setTimeout(() => controller.abort(), timeoutMs)`.

### 2.3 Monolithic page components (~1300-1650 lines each)

**Files:** `src/pages/VideoPage.tsx` (1648 lines), `src/pages/GeneratePage.tsx` (1335 lines)

These are extremely large single-file components. Not a bug, but makes maintenance difficult. Each contains inline sub-components, helper functions, and complex state.

**Fix (gradual):** Extract sub-components (frame editor cards, setup form, batch progress panel) into separate files. No behavior change.

### 2.4 `useMultiShotGeneration` hook references `characterRefUrl` in deps but never uses it

**File:** `src/hooks/useMultiShotGeneration.ts:161`

```ts
}, [modules, model, aspectRatio, kieApiKey, geminiApiKey, promptModel, characterHeroUrl, characterRefUrl, productImageUrl]);
```

`characterRefUrl` is destructured from options (line 54) and included in the `start` dependency array, but **never used** inside the `start` function.

**Fix:** Remove from dependency array. Safe — no behavior change.

### 2.5 `useUpscale` creates a new `useApiKeys` instance per call

**File:** `src/hooks/useUpscale.ts:12`

Every component using `useUpscale()` also triggers a full `useApiKeys()` fetch. If the parent already has `useApiKeys`, this duplicates the fetch.

**Fix:** Accept `kieApiKey` as a parameter instead. ⚠️ Minor API change — needs caller updates.

---

## 3. Low Priority Cleanup

### 3.1 Unused imports

- `src/pages/VideoPage.tsx`: `Skeleton` is imported but only used inside the setup conditional. Consider if it's truly needed or can be lazy.
- `src/pages/GeneratePage.tsx:59`: `SelectGroup`, `SelectLabel` — verify all are used.

### 3.2 `PRESETS` array duplicated

**Files:** `src/pages/GeneratePage.tsx:165` and likely `src/pages/CharactersPage.tsx`

The same 10 preset characters are hardcoded in multiple files.

**Fix:** Extract to `src/lib/character-presets.ts`.

### 3.3 Inconsistent toast imports

Some files use `import { toast } from "@/hooks/use-toast"` (direct function), others use `const { toast } = useToast()` (hook). Both work, but it's inconsistent.

---

## 4. Safe Refactor Suggestions

| # | Refactor | Files | Risk |
|---|----------|-------|------|
| 1 | Extract `imageUrlToBase64` + `fileToBase64` to `src/lib/image-utils.ts` | VideoPage, GeneratePage, CreateCharacterPage | None |
| 2 | Extract `PRESETS` to `src/lib/character-presets.ts` | GeneratePage, CharactersPage | None |
| 3 | Fix `timeoutMs` parameter in `gemini-fetch.ts` | gemini-fetch.ts | None |
| 4 | Remove unused `protectedPaths` from App.tsx | App.tsx | None |
| 5 | Remove `characterRefUrl` from `start` deps | useMultiShotGeneration.ts | None |

---

## 5. Dead / Unused Code

| Item | Location | Status |
|------|----------|--------|
| `GalleryPage.tsx` | `src/pages/GalleryPage.tsx` | No route — orphaned |
| `protectedPaths` const | `src/App.tsx:24-33` | Declared, never used |
| `timeoutMs` parameter | `src/lib/gemini-fetch.ts:12` | Accepted but ignored |
| `characterRefUrl` in `start` deps | `src/hooks/useMultiShotGeneration.ts:161` | In dep array but unused |
| `MultiShotCreator.tsx` | `src/components/video/MultiShotCreator.tsx` | Verify if imported anywhere |

---

## 6. Summary

The highest-impact, safest wins are:
1. **Extract shared `imageUrlToBase64`** — eliminates 3-way duplication and fixes mimeType bug
2. **Remove dead `protectedPaths`** from App.tsx — pure cleanup
3. **Fix `timeoutMs` parameter** in gemini-fetch — 1-word fix
4. **Decide on GalleryPage** — route it or remove 400 lines of dead code

All of these preserve existing behavior exactly.

