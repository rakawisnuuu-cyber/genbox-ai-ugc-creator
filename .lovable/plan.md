

# Remove Emojis from Dashboard

Scan found emojis and arrow symbols (`→`, `✨`, `✅`, `❌`, `💡`, `🎬`) used as visible UI text across dashboard pages. Here's the cleanup plan:

## Files to Edit

### 1. `src/pages/GeneratePage.tsx`
- Line 1196: `✅ {completedShots} selesai{...} ❌ ${failedShots} gagal` — Replace `✅` with Lucide `CheckCircle2` icon, `❌` with `XCircle` icon
- Line 1262: `"...Buat Video → pilih template..."` — Replace `→` with `—` or remove
- Line 1286: `"Buat Video dari Storyboard →"` — Replace `→` with Lucide `ArrowRight` icon

### 2. `src/pages/VideoPage.tsx`
- Line 471: `"Storyboard berhasil direncanakan! ✨"` — Remove `✨`
- Line 1106: `💡 {modelRec.text}` — Replace `💡` with Lucide `Lightbulb` icon
- Line 1566: `🎬 Semua Frame Selesai!` — Replace `🎬` with Lucide `Film` or `Clapperboard` icon

### 3. `src/pages/GalleryPage.tsx`
- Line 95: `toast.info("...Klik kanan gambar → 'Save image as...'")`— Replace `→` with `—`
- Line 192: `→ Buat Video` button text — Replace `→` with Lucide `ArrowRight` icon

### 4. `src/components/GalleryContent.tsx`
- Line 86: Same toast pattern `→` — Replace with `—`

### 5. `src/pages/CreateCharacterPage.tsx`
- Line 345: `"Buka Settings → API Keys..."` — Replace `→` with `—`

### 6. `src/pages/BlueprintPage.tsx`
- Lines 5-7: `→` in description strings — Replace with `—`

### 7. `src/components/FiturSection.tsx`
- Line 80: `"Gunakan →"` — Replace `→` with Lucide `ArrowRight` icon (this is in the landing page feature section but still uses emoji-style arrow)

## Not Touched
- Code comments with `→` (not user-facing)
- `MultiShotCreator.tsx` (explicitly excluded per prior instructions)
- `HeroSection.tsx` CTA arrow (design intentional, uses `<span>` separated arrow)
- Any business logic, API calls, or state management

