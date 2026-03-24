

## Plan: Update Price to 99.000 + Switch Prompt Engine from OpenAI to Gemini

### Part 1: Price Update

**File: `src/lib/pricing.ts`**
- Change `price: 79_000` → `price: 99_000`

That's it — all UI references use the `PRICING` constant, so the change propagates automatically.

### Part 2: Prompt Engine — Replace OpenAI with Gemini

**File: `src/pages/PromptEnginePage.tsx`**

**Imports:**
- Remove `import { openAiFetch } from "@/lib/openai-fetch"`
- Add `import { geminiFetch } from "@/lib/gemini-fetch"` and `import { usePromptModel } from "@/hooks/usePromptModel"`

**Hook & key setup:**
- Add `const { model: promptModel } = usePromptModel()` near other hooks
- Remove `openaiKey` alias (line 53), `openAiKey` state (line 92), the `useEffect` that fetches it (lines 94-105), and the `apiKey` fallback (line 108)
- Replace with: `const apiKey = keys.gemini.key` and `const apiKeyValid = keys.gemini.status === "valid"`

**Add `callGemini` helper:**
A `useCallback` wrapper that translates the old `openAiFetch(key, system, user, image?)` interface to `geminiFetch(model, key, { systemInstruction, contents })` — supports optional image via `inlineData`.

**Replace 4 call sites:**
1. `generateConcepts` (line 155): `openAiFetch(apiKey, CAMPAIGN_SYSTEM_PROMPT, userMsg)` → `callGemini(CAMPAIGN_SYSTEM_PROMPT, userMsg)`
2. `generateFinalPrompts` (line 191): same pattern
3. `decodeImageAction` (line 215-220): pass image as `{ mimeType, data }` third arg to `callGemini`
4. `generateMotionPrompt` (line 246-251): same with image

**Update disabled conditions on 3 buttons:**
- Campaign generate: `disabled={!purpose || moods.length === 0 || !world || !apiKeyValid}`
- Decode: `disabled={!decodeImage || !apiKeyValid}`
- Motion: `disabled={!motionImage || !apiKeyValid}`

**Update warning text (line 768-771):**
- Change condition to `!apiKeyValid`
- Update text to mention Gemini only (remove "OpenAI")

### Files Changed

| File | Change |
|------|--------|
| `src/lib/pricing.ts` | Price 79000 → 99000 |
| `src/pages/PromptEnginePage.tsx` | Replace openAiFetch with geminiFetch, clean up key logic, update disabled checks and warning |

