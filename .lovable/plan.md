

## Plan: Move Gallery Picker from Setup to Per-Frame "Ganti Gambar"

### What changes

1. **Remove gallery grid from the setup screen** (lines 925-943 in VideoPage.tsx)
   - Keep only the upload dropzone for the initial source image selection
   - The gallery fetch logic (`galleryImages` state, the `useEffect` that loads them) stays — it will be used in the per-frame picker

2. **Enhance per-frame "Ganti" button** (lines 1255-1295) to show a small popover/dropdown with two options:
   - **Upload gambar** — current file picker behavior
   - **Pilih dari gallery** — shows a small grid of gallery images inline (same data from `galleryImages` state)
   
   Implementation: Use a small expandable section below the reference image. When user clicks "Ganti gambar", toggle a panel showing:
   - A row of gallery thumbnails (scrollable, max ~8-12 images)
   - An "Upload" button
   
   When a gallery image is selected, set `frame.sourceImageUrl` to that URL. When uploading, keep existing upload-to-storage logic.

3. **No logic changes** — all generation, base64, product detection logic stays intact. Only the UI placement of gallery selection moves.

### Files to edit

- `src/pages/VideoPage.tsx` — Remove gallery grid from setup section; enhance per-frame reference image section with gallery picker

