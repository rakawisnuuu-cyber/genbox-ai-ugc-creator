

## Plan: Landing Page Revamp — B2Bizz-Inspired Design

Adopt B2Bizz's visual language: abstract gradient orb hero, cream/warm text tones, asymmetric layouts, horizontal marquees, and spacious editorial typography. Keep all existing content/features, just restyle.

---

### Design System Changes

**File: `src/index.css`**
- Add warm cream color variable: `--cream: 50 80% 90%` for headings
- Add abstract orb hero gradient (green-to-blue sphere) as a CSS class `.hero-orb`
- Add infinite marquee animation (already exists but refine speed)

**File: `tailwind.config.ts`**
- Add `cream` color token
- Add `font-serif` with `"Instrument Serif", "Playfair Display", Georgia, serif`

**File: `index.html`**
- Add Google Fonts import for Instrument Serif

---

### Component Changes (8 files)

**1. `src/components/HeroSection.tsx`** — Full redesign
- Replace centered layout with **split layout**: headline bottom-left, CTA button bottom-right (like B2Bizz)
- Replace grid-pattern background with **large abstract gradient orb** (CSS radial-gradient sphere with green/blue/amber tones)
- Headline in warm cream color, larger (64-80px), editorial feel
- CTA becomes a cream/light pill button with dark text (B2Bizz style) instead of lime
- Trust pills become a **horizontal marquee strip** at the very bottom of the hero (icon + text, infinite scroll)
- Keep DepthDeckCarousel but move it behind/above the headline as ambient visual
- Remove grid-pattern, keep parallax scroll on the orb

**2. `src/components/Navbar.tsx`** — Subtle updates
- CTA button becomes cream/light pill (rounded-full) with dark text instead of lime rectangle
- Nav links get slightly warmer color
- Keep glassmorphism backdrop

**3. `src/components/DibuatUntukSection.tsx`** — Restyle
- Heading in warm cream gradient
- Cards get more spacing, slightly larger text
- Add subtle hover lift effect (B2Bizz card style)

**4. `src/components/FiturSection.tsx`** — Layout refinement
- Section heading left-aligned with description (like B2Bizz "What makes us" section)
- Feature cards: wider, more horizontal breathing room
- Keep all interactive animations (CharacterStack, BeforeAfter, Video)

**5. `src/components/CaraKerjaSection.tsx`** — Minimal changes
- Heading warm cream gradient
- Step numbers slightly larger
- Keep 5-column grid desktop layout

**6. `src/components/HargaSection.tsx`** — Card refinement
- Pricing card border goes cream/warm instead of lime
- CTA button cream pill style
- Keep all pricing data

**7. `src/components/FinalCTASection.tsx`** — Redesign
- Large cream headline, asymmetric layout
- Abstract orb background behind the CTA (similar to hero)
- Cream pill CTA button

**8. `src/components/FooterSection.tsx`** — Clean up
- Remove duplicate CTA section (it's redundant with FinalCTASection)
- Keep just the footer bar with logo, copyright, links
- Warmer muted tones

---

### New: Marquee Component

**File: `src/components/MarqueeStrip.tsx`**
- Reusable infinite horizontal scroll strip
- Props: `items`, `speed`, `direction`
- Used in HeroSection (trust indicators) and optionally in DibuatUntukSection

---

### What Stays Unchanged
- All interactive animations (CharacterStack, BeforeAfterReveal, VideoPreview)
- DepthDeckCarousel component internals
- FAQ section (recently redesigned)
- ApiCostSection (data-heavy, works well as-is)
- All dashboard/generate pages (not landing page)
- All backend logic

---

### Technical Details

**New files (2):**
- `src/components/MarqueeStrip.tsx`

**Modified files (9):**
- `src/index.css` — cream variables, hero-orb class
- `tailwind.config.ts` — cream color, serif font
- `index.html` — Instrument Serif font
- `src/components/HeroSection.tsx`
- `src/components/Navbar.tsx`
- `src/components/DibuatUntukSection.tsx`
- `src/components/FiturSection.tsx`
- `src/components/CaraKerjaSection.tsx`
- `src/components/HargaSection.tsx`
- `src/components/FinalCTASection.tsx`
- `src/components/FooterSection.tsx`

**Build order:** Design system (CSS + Tailwind + font) → MarqueeStrip → Hero → Navbar → remaining sections top-to-bottom

