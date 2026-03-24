

## Fix Plan: SceneDNA Not Running + Product Description Leak

### Bug 1: SceneDNA analysis silently fails

**Root cause**: `imageUrlToBase64WithMime` uses `fetch(url)` to convert the kie.ai CDN image URL to base64. This likely fails due to CORS — the CDN serves images fine for `<img>` tags but may block `fetch()` without proper `Access-Control-Allow-Origin` headers. The catch block returns `null`, and `getOrAnalyzeScene` silently returns `""` with no user feedback.

**Fix — two parts:**

1. **Add canvas-based fallback in `src/lib/image-utils.ts`**: Create `imageUrlToBase64ViaCanvas(url)` that loads the image via an `Image` element with `crossOrigin = "anonymous"`, draws to a canvas, and extracts base64 via `canvas.toDataURL()`. If that also fails (CORS on img tag), fall back to a server-side proxy approach isn't feasible — so instead, update `imageUrlToBase64WithMime` to try fetch first, then try canvas fallback.

2. **Add error surfacing in `getOrAnalyzeScene`** in GeneratePage: When `b64` is null, show a toast warning ("Tidak bisa menganalisis gambar — menggunakan template standar") so the user knows SceneDNA was skipped, rather than silently degrading.

### Bug 2: Full product_description in video prompts

**Root cause**: All video prompt builder calls pass `dna?.product_description` as the `product` param. This is a long visual description paragraph that gets interpolated into beat action sentences, making them unreadable.

**Fix**: Create a derived `shortProductName` near the other state declarations in GeneratePage:

```ts
const shortProductName = useMemo(() => {
  if (!dna) return "produk ini";
  const brand = dna.brand_name !== "unknown" ? dna.brand_name : "";
  const sub = dna.sub_category || dna.category;
  return brand ? `${brand} ${sub}` : sub;
}, [dna]);
```

Then replace `dna?.product_description || ""` with `shortProductName` in the `product` field of all 6 call sites:
- `openMotion` (line 268)
- `buildMotionPrompt` (line 224)  
- `buildTalkPrompt` (line 239)
- Motion preset buttons (line 1125)
- `openTalking` beat defaults (line 291 — this one uses product_description for dialogue generation, keep it there since it's for script context, not prompt injection)

The full `dna.product_description` is still available via `sceneDNA` for visual reference — the `product` param should just be a short name for sentence construction.

### Files changed

| File | Change |
|------|--------|
| `src/lib/image-utils.ts` | Add canvas-based fallback to `imageUrlToBase64WithMime` |
| `src/pages/GeneratePage.tsx` | Add `shortProductName` memo; replace `product` param in 5 call sites; add toast on SceneDNA failure |

### No behavior changes
- All existing video generation logic untouched
- Product DNA detection unchanged
- SceneDNA analysis logic unchanged — only the base64 conversion gets a fallback

