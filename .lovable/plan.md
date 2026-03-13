

# Plan: Two-Step Storyboard — Prompts First, Then Generate Per Frame

## Current vs New Flow

**Current:** Click "Generate Storyboard" → system generates prompt + image for each frame sequentially (all 5 at once, no user review)

**New:**
1. Click **"Generate Prompts"** → Gemini generates all 5 beat prompts in one call → displayed in right panel as editable text cards
2. User **reviews/edits** each prompt
3. User clicks **"Generate"** on individual frames (or "Generate All" for convenience)

## Changes to `src/pages/GeneratePage.tsx`

### New State
```typescript
// Prompt-first state
const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
const [promptsLoading, setPromptsLoading] = useState(false);
```

### Step 1 — "Generate Prompts" Button
Replaces current "Generate Storyboard" button. Calls Gemini ONCE with all 5 beats + product DNA + character, asks for a JSON array of 5 prompts. Populates `generatedPrompts[]`.

### Step 2 — Right Panel Shows Prompt Cards
Each frame shows:
- Beat role badge + label
- Editable textarea with the generated prompt
- "Generate" button per frame (calls `generateKieImage` for that single frame)
- Status indicator (pending / generating / completed / failed)

### Step 3 — Per-Frame Generation
Each "Generate" button triggers Kie AI for that single frame. Frame 0 generates first (anchor), frames 1-4 use frame 0's result as visual reference. A "Generate All" button runs them sequentially.

### Right Panel Layout (new states)

```text
State A: No prompts yet → empty state with beat preview (current)
State B: Prompts generated → 5 editable prompt cards with per-frame Generate buttons
State C: Frames generating/completed → current grid but with prompt visibility
```

### Gemini Prompt Generation Call
Single call returns all 5 prompts as JSON array. System instruction includes product DNA, character identity, template beats, environment, and constraints. Output format: `["prompt1", "prompt2", ...]`

### UI Detail for State B (prompt cards)
- Vertical list (not grid) for readability
- Each card: role badge, beat label, textarea (auto-height), "Generate Frame" button
- Top bar: "Generate All Frames" button + "Regenerate Prompts" button
- Prompts are editable — user can tweak before generating

### File Changes

| Area | Change |
|------|--------|
| Left panel button | "Generate Storyboard" → "Generate Prompts" |
| New function | `generatePrompts()` — single Gemini call → 5 prompts |
| Existing `generateStoryboard()` | Refactored to `generateAllFrames()` — uses `generatedPrompts[]` instead of generating prompts inline |
| New function | `generateSingleFrame(idx)` — generates one frame from `generatedPrompts[idx]` |
| Right panel | New "prompt review" state between empty and generating |
| `shotStatuses` | Add `"prompt_ready"` state |

Only `src/pages/GeneratePage.tsx` changes. No other files affected.

