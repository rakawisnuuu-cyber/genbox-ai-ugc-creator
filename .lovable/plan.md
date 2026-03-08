

## Plan: Create GENBOX Logo

Design a custom SVG logo for GENBOX that matches the dark luxury aesthetic (lime accent `hsl(75 85% 52%)`, clean geometric style like Vercel/Linear).

### Approach
Create a minimal geometric logomark + wordmark as an SVG component:

- **Logomark**: A stylized "G" or abstract box/cube shape using the lime primary color — clean, geometric, modern
- **Wordmark**: "GENBOX" in bold uppercase with tight tracking (matching existing font style)
- **Variants**: Full logo (icon + text), icon-only for small spaces

### Changes

1. **`src/components/GenboxLogo.tsx`** — New reusable SVG logo component with props for `size`, `variant` ("full" | "icon"), and `className`
2. **`src/components/Navbar.tsx`** — Replace text "GENBOX" with the logo component
3. **`src/components/DashboardLayout.tsx`** — Replace text "GENBOX" in sidebar and mobile header with the logo component

### Design Direction
A geometric cube/box with one face tinted lime, suggesting "generation" + "box" — minimal enough to work at 24px and 64px sizes. The wordmark sits beside it with the same bold tracking style already used.

