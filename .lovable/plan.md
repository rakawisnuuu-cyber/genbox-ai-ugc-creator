

## Plan: Decompose GeneratePage.tsx (Batch 1 + Batch 2)

Systematic extraction of constants, types, and UI sections into separate files. Pure refactor — zero behavior changes.

---

### Batch 1: Extract Constants & Types (2 new files)

**File 1: `src/lib/prompt-blocks.ts`**
- Export 5 constants: `SKIN_BLOCK`, `QUALITY_BLOCK`, `NEGATIVE_BLOCK`, `ENV_REALISM_BLOCK`, `UGC_STYLE_BLOCK`
- Exact text from lines 73-82

**File 2: `src/lib/generate-types.ts`**
- Export `GenState` type (line 153)
- Export `ShotStatus` interface (lines 156-161)

**Changes to `GeneratePage.tsx`:**
- Remove lines 72-82 (realism blocks) and lines 153-161 (types)
- Add two imports at top

---

### Batch 2: Decompose UI into 5 Components

**2.1: `src/components/generate/ProductUploadStep.tsx`**
- Lines 1029-1183 (Step 01 — Upload Produk)
- Props: `productPreview`, `productUrl`, `productDNA`, `detectingDNA`, `uploading`, `dnaExpanded`, `setDnaExpanded`, `setProductDNA`, `handleFileSelect`, `removeProduct`, `onDrop`
- Imports: `Upload`, `X`, `Loader2`, `ScanSearch`, `ChevronDown`, `Info`, Select components, Input, ProductDNA/ProductCategory types

**2.2: `src/components/generate/CharacterSelectStep.tsx`**
- Lines 1186-1333 (Step 02 — Pilih Karakter)
- Props: `selectedCharId`, `selectedChar`, `customChars`, `ownPhotoPreview`, `ownPhotoUploading`, `ownPhotoAnalyzing`, `onCharSelect`, `handleOwnPhotoSelect`, `removeOwnPhoto`, `navigate`
- Imports: `Camera`, `UserCircle`, `Loader2`, `X`, `LinkIcon`, Select components, PRESETS, CharacterData

**2.3: `src/components/generate/TemplateSelectStep.tsx`**
- Lines 1335-1393 (Step 03 — Content Template)
- Props: `storyboardTemplate`, `productCategory`, `hasPrompts`, `onSelect`, `onConfirmChange`
- Contains the sorting logic (recommended templates)
- Template change confirmation stays in GeneratePage

**2.4: `src/components/generate/SceneSettingsStep.tsx`**
- Lines 1395-1495 (Step 04 — Scene Settings)
- Props: `background`, `setBackground`, `customBg`, `setCustomBg`, `pose`, `setPose`, `mood`, `setMood`, `envOptions`, `poseOptions`, `moodOptions`, `advancedOpen`, `setAdvancedOpen`
- Imports: Select components, Input, ChevronDown

**2.5: `src/components/generate/StoryboardPanel.tsx`**
- Lines 1520-1821 (entire right panel)
- Props: `hasPrompts`, `promptsLoading`, `storyboardActive`, `storyboardTemplate`, `currentBeats`, `generatedPrompts`, `shotStatuses`, `storyboardElapsed`, `completedShots`, `failedShots`, `totalShots`, `storyboardDone`, `selectedChar`, `productDNA`, `updatePromptText`, `generateSingleFrame`, `generateAllFrames`, `cancelStoryboard`, `resetStoryboard`, `navigate`, `kieApiKey`
- Contains: empty state, loading state, prompt cards, action buttons
- Imports: Loader2, Film, RefreshCw, Play, ArrowRight, ImageIcon, Download, Textarea, CONTENT_TEMPLATES, getStoryRoleColor

**2.6: Wire together in GeneratePage.tsx**
- Import all 5 components
- Replace JSX blocks with component calls, passing correct props
- `StepLabel` helper stays in GeneratePage (used by all steps via wrapper)
- All `useState` hooks, `useEffect` hooks, handler functions remain in GeneratePage
- AlertDialog for template change stays in GeneratePage
- Generate Prompts CTA button (lines 1497-1517) stays in GeneratePage (between steps and panel)

---

### Technical Details

**New files (7):**
- `src/lib/prompt-blocks.ts`
- `src/lib/generate-types.ts`
- `src/components/generate/ProductUploadStep.tsx`
- `src/components/generate/CharacterSelectStep.tsx`
- `src/components/generate/TemplateSelectStep.tsx`
- `src/components/generate/SceneSettingsStep.tsx`
- `src/components/generate/StoryboardPanel.tsx`

**Modified files (1):**
- `src/pages/GeneratePage.tsx` — shrinks from ~1858 to ~450 lines

**Invariants:**
- All handler functions stay in GeneratePage
- `StepLabel` component stays in GeneratePage (passed as prop or kept inline)
- Quality blocks (`SKIN_BLOCK` etc.) usage in `generatePrompt` (line 635) and `generateSingleFrame` (line 895) unchanged
- Template change dialog stays in GeneratePage
- No behavior, styling, or logic changes

