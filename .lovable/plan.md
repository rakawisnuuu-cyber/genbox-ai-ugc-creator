

## Plan: Add "Buat Karakter" Button to Preset Grid

Add a "create character" card as the first item in the preset character grid, styled as a dashed-border card matching the grid's card dimensions.

### Changes (`src/pages/CharactersPage.tsx`)

In the preset tab grid, prepend a styled button/card before the preset cards:
- Dashed border card with `Plus` icon and "Buat Karakter Baru" text
- Same aspect ratio as `CharacterCard` for visual consistency
- Navigates to `/characters/create` on click
- Subtle hover effect matching the existing card style

Single file change, ~15 lines added.

