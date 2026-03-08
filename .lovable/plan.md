

## Assessment: Project Weight & Mobile Readiness

### Performance for Concurrent Users

**Good news — your app is very safe for many concurrent users.** Here's why:

- **It's a static frontend (SPA)** — Vite builds everything into static JS/CSS/HTML files served from CDN. There's no server rendering per user. 1 user or 10,000 users hitting the landing page costs the same.
- **Backend load is minimal** — The only backend calls are authentication (login/signup) and reading user credits/settings. These are handled by Lovable Cloud which auto-scales.
- **Heavy API calls (Gemini, Kie AI) go directly from the user's browser to external APIs** — your backend is NOT a bottleneck for video/image generation.
- **No SSR, no server-side compute** — pure client-side rendering.

**Potential concerns (minor):**
- `AnimatedBackground` renders 5 blurred orbs with CSS animations — lightweight, no issue
- `GeneratePage` (1505 lines) and `VideoPage` (1643 lines) are large single files, but they're only loaded for authenticated users, not landing page visitors
- Keep-alive mounting means both Generate and Video pages stay in memory simultaneously — slightly heavier for dashboard users but acceptable

**Verdict: Safe for thousands of concurrent users. No changes needed.**

---

### Mobile Readiness Issues

The landing page and dashboard layout have responsive classes (`lg:`, `sm:`) and work on mobile. However, there are a few gaps to fix:

1. **`index.html` missing mobile meta tags** — No `theme-color`, no `apple-mobile-web-app-capable`, no touch icon
2. **`VideoPage.tsx` has minimal responsive classes** — Only `sm:` breakpoints in a couple places, likely cramped on small screens
3. **No viewport height fix** — Mobile browsers have dynamic address bars that affect `min-h-screen`; no `dvh` or workaround in place
4. **No touch-friendly adjustments** — Small tap targets in dense UI areas (video frames, settings panels)

### Plan: Mobile Hardening

**1. `index.html`** — Add mobile-essential meta tags:
- `theme-color` matching dark background
- `apple-mobile-web-app-capable` for fullscreen feel
- `apple-touch-icon` placeholder

**2. `src/pages/VideoPage.tsx`** — Audit and add responsive breakpoints for:
- Frame grid layout on small screens
- Controls and buttons sizing for touch
- Scrollable areas with proper overflow

**3. `src/pages/GeneratePage.tsx`** — Already decent but verify:
- Panel stacking works correctly on mobile
- No horizontal overflow issues

**4. `src/index.css`** — Add `min-h-[100dvh]` support for mobile viewport height

This is a focused set of mobile fixes — no structural changes needed. The app's architecture is already concurrent-user-safe.

