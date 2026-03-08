

## Plan: Multi-Reference Photo Upload for Character Creation

### Problem
Currently only 1 reference photo is supported. Multiple photos from different angles (front, 3/4, profile) would give Gemini better facial analysis, producing more consistent and accurate character generations.

### Changes (single file: `src/pages/CreateCharacterPage.tsx`)

**1. Replace single photo upload with multi-photo upload (up to 5)**
- Change state from single `refUrl`/`refPreview` to arrays (`refUrls: string[]`, `refPreviews: string[]`)
- Show a grid of uploaded photos with individual remove buttons and an "add more" slot
- Keep the same 5MB-per-file limit, max 5 photos total
- Upload each to `character-packs` bucket as before

**2. Update Gemini identity analysis to use all photos**
- Send all reference photos as inline images to Gemini
- Update the prompt to instruct Gemini to cross-reference multiple angles for more accurate facial feature extraction
- Example prompt addition: "Multiple reference photos from different angles are provided. Cross-reference all photos to identify consistent facial features."

**3. Update hero image generation**
- Pass all reference URLs as `image_url` inputs (or primary reference only if API limits to 1)
- Store all URLs in the `reference_images` array column (already exists in DB)
- Continue storing the first photo as `reference_photo_url` for backward compatibility

**4. Update variation generation**
- When generating the 5 variation shots, include all reference photos as anchors alongside the hero image

**5. UI guidance text**
- Add helper text: "Upload 1-5 foto dari berbagai sudut (depan, samping, 3/4) untuk hasil lebih akurat"
- Show upload count indicator: "3/5 foto"

### Technical Notes
- The `reference_images` column already exists in the `characters` table as `string[]`, so no DB migration needed
- The `CharacterCard` and `CharacterDetailModal` components already handle `reference_images` display
- Gemini API supports multiple inline images in a single request

