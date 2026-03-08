

## Plan: Add Male-Focused Quick Presets

Currently 3 of 6 vibe packs are female-coded (Hijab Casual, Clean Girl, Ibu Muda), none are explicitly male. Add 3 new male-oriented vibe packs to balance it out.

### New Vibe Packs (`src/lib/character-vibes.ts`)

1. **Cowok Urban** — Streetwear/casual male, 20-28, athletic build, outdoor urban setting
2. **Bapak Profesional** — Mature professional male, 35-50, smart casual/formal, studio/office
3. **Cowok Gym** — Athletic male, 22-30, sportswear, energetic outdoor/gym setting

Each pack follows the existing `VibePack` interface with full `VibePackConfig` fields (expression, outfit, skinDetail, lighting, setting, hairStyle, ageRange, bodyType, imperfection, environment).

### Single file change
- `src/lib/character-vibes.ts` — append 3 new entries to `VIBE_PACKS` array

