

## Plan: Fix Preset Character Matching & Add "Pakai Foto Sendiri"

### Problem
1. Preset characters excluded from image references (line 500: `!selectedChar.id.startsWith("p")` filter)
2. No way to upload a one-off character photo without full character creation flow

---

### Fix 1: Include preset hero images as Kie AI reference

**File: `src/pages/GeneratePage.tsx` (~line 498-501)**

Remove the preset filter so ALL characters send their `hero_image_url`:
```typescript
if (selectedChar?.reference_photo_url) imageInputs.push(selectedChar.reference_photo_url);
if (selectedChar?.hero_image_url) imageInputs.push(selectedChar.hero_image_url);
if (productUrl) imageInputs.push(productUrl);
```

### Fix 2: Send character image to Gemini in generatePrompt()

**File: `src/pages/GeneratePage.tsx` (~line 372-414)**

Before the product image inline data, add the character's `hero_image_url` as base64 `inlineData` with instruction text: "This is the CHARACTER reference image. Describe this EXACT person's appearance in your prompt." Also send `reference_photo_url` if different.

Update the Gemini prompt text to include a critical instruction when a character image is attached — the `final_prompt` must BEGIN with the character's exact appearance description. Add `character_appearance` to the JSON output schema.

### Fix 3: Show preset thumbnails in dropdown

**File: `src/pages/GeneratePage.tsx` (~line 856-863)**

Replace `UserCircle` icon for presets with `<img src={c.hero_image_url} className="h-5 w-5 rounded-full object-cover" />` since all presets have hero images.

### Feature: "Pakai Foto Sendiri" upload section

**File: `src/pages/GeneratePage.tsx`**

Add new state variables: `ownPhotoPreview`, `ownPhotoUrl`, `ownPhotoUploading`, `ownPhotoAnalyzing`.

Insert a new section above the character dropdown (between "Pilih Karakter" label and `<Select>`):
- Dashed border button with Camera icon — "Pakai Foto Sendiri" / subtitle "Upload foto kamu — AI akan analisis & cocokkan"
- On file select: upload to `character-packs/{userId}/own-photo/`, then call Gemini Vision to analyze the photo extracting name, gender, age_range, style, identity_prompt
- Create ad-hoc `CharacterData` with `id: "__own_photo__"`, set as selected character with both `hero_image_url` and `reference_photo_url` pointing to uploaded URL
- Show circular preview with detected name/type, loading spinners for upload/analysis, X button to remove
- Divider text "atau pilih karakter" between own-photo section and dropdown

Mutual exclusion logic:
- `onCharSelect` clears own photo state
- `removeOwnPhoto` clears character selection if current is `__own_photo__`
- When own photo is active, dropdown shows as unselected

Fallback: if Gemini analysis fails, create CharacterData with name "Foto Saya" and generic description — photo still sent as image reference.

**Files to edit**: `src/pages/GeneratePage.tsx` only

