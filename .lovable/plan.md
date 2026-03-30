

## Fix: Absolute URLs for Image Generation API

**Problem**: After migrating assets to `/public/assets/`, preset character `hero_image_url` values are relative paths (e.g. `/assets/characters/hijab-casual.jpeg`). The Kie AI API requires absolute URLs.

**No remaining Supabase URLs found** — the search for `hgwojnluqkrypwttytxb` returned zero results, so that part is already clean.

### Changes — single file: `src/pages/GeneratePage.tsx`

**1. Add absolute URL conversion after line 174** (where `charImg` is defined):

```typescript
const charImg = charId === "own-photo" ? ownUrl || "" : char?.hero_image_url || "";
const fullCharImg = charImg.startsWith("/") ? `${window.location.origin}${charImg}` : charImg;
const fullProdUrl = prodUrl?.startsWith("/") ? `${window.location.origin}${prodUrl}` : prodUrl;
```

**2. Replace `charImg` → `fullCharImg` and `prodUrl` → `fullProdUrl` in 3 locations:**

- **Line 465** (`GenerationConfig`): `characterImageUrl: fullCharImg`
- **Line 466**: `productImageUrl: fullProdUrl`
- **Line 482** (`imgGen.start`): `characterImageUrl: fullCharImg`
- **Line 483**: `productImageUrl: fullProdUrl`
- **Line 497** (`imgGen.retryShot`): `characterImageUrl: fullCharImg`
- **Line 498**: `productImageUrl: fullProdUrl || ""`

No UI, layout, or logic changes — only URL string formatting before passing to the API.

