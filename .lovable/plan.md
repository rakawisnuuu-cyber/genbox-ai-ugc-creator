

# Storyboard Flow Revamp

## Current Flow (What Exists)
1. Upload product → 2. Select character → 3. Scene settings → 4. Generate prompt → 5. Generate base image → 6. Pick template (hidden in right panel after image) → 7. Generate storyboard

The template picker only appears AFTER a base image is generated (line 1326: `!storyboardActive && shotStatuses.length === 0` inside the `genState === "completed"` block on the right panel).

## New Flow (What We're Building)
1. Upload product → 2. Select character → 3. **Pick content template** → 4. Scene settings → 5. Generate prompt (template-aware) → 6. Generate base image → 7. Storyboard auto-populates with beat previews → 8. Generate storyboard

## Changes

### A. Move Template Picker to Left Panel
Move the template selection UI from the right panel (after image generation) into the left panel, between "Pilih Karakter" and "Pengaturan Scene". This makes template selection a required step BEFORE prompt generation.

### B. Make Prompt Generation Template-Aware
When a template is selected, inject the template's narrative structure into the Gemini prompt so the base image is generated with the correct starting beat in mind. For example, if "Before After" is selected, the base prompt should match the "Before State" beat (frame 1).

### C. Enforce `noProductUsage` Constraint
In `generateSingleBeat`, check `beat.constraints?.noProductUsage`. If true, append instruction to the Gemini prompt: "The product must NOT be shown being used, held, or applied in this frame. It can be visible in the background or nearby but NOT actively used."

### D. Auto-Show Storyboard After Base Image
Once the base image generates AND a template is selected, immediately show the beat preview timeline on the right panel (no need to re-pick template). The "Generate Storyboard" button appears right away.

### E. Recommended Templates Badge
Show which templates are recommended for the detected product category using the existing `recommendedFor` field in content templates.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/GeneratePage.tsx` | Move template picker to left panel, inject template into prompt generation, enforce constraints in storyboard beats, auto-show storyboard after base image |

Single file change — all logic is in GeneratePage.tsx.

