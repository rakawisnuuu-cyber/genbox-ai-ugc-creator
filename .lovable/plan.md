

## Bug Found: Product DNA & All Vision Features Broken

### Root Cause

In `src/lib/gemini-fetch.ts`, the `geminiBodyToOpenAI` converter (used for Kie AI primary provider) checks for **`inline_data`** (snake_case) on lines 45 and 54. But every caller in the codebase uses **`inlineData`** (camelCase) — the native Gemini format.

This means when requests go through Kie AI (the primary/first provider), **all image data is silently dropped**. The LLM receives text-only messages, causing Product DNA analysis, Scene DNA, and all vision features to fail or return garbage.

### Affected Features

| Feature | File | Impact |
|---------|------|--------|
| Product DNA analysis | `src/lib/product-dna.ts` | Image dropped → empty/wrong analysis |
| Scene DNA for video | `src/lib/scene-dna.ts` | Image dropped → fails |
| Character creation (ref images) | `src/pages/CreateCharacterPage.tsx` | Ref images not sent to LLM |
| Video shot generation | `src/pages/VideoPage.tsx` | Product/scene images dropped |
| Multi-shot environment detect | `src/components/video/MultiShotCreator.tsx` | Image dropped |
| Prompt Engine (Decode Visual) | `src/pages/PromptEnginePage.tsx` | Image dropped |

### Fix

**File: `src/lib/gemini-fetch.ts`** — Update `geminiBodyToOpenAI` to check for **both** `inline_data` and `inlineData`:

- Line 45: `parts.some((p: any) => p.inline_data || p.inlineData)`
- Line 54: `if (part.inline_data || part.inlineData)` then use whichever is present
- Line 58: Access `(part.inline_data || part.inlineData).mime_type` or `.mimeType` (handle both casing conventions)

Specifically, the image extraction block becomes:
```typescript
const imgData = part.inline_data || part.inlineData;
if (imgData) {
  const mime = imgData.mime_type || imgData.mimeType;
  multiParts.push({
    type: "image_url",
    image_url: {
      url: `data:${mime};base64,${imgData.data}`,
    },
  });
}
```

This is a **one-file, ~6-line fix** that restores all vision/multimodal features across the entire app.

### Files Changed

| File | Change |
|------|--------|
| `src/lib/gemini-fetch.ts` | Handle both `inlineData` and `inline_data` casing in converter |

