

# GENBOX Landing Page — Implementation Plan

## Design Foundation
Apply the GENBOX V2 design system: dark-only theme (#0A0A0A background, #141414 cards, lime green #BFFF00 accent), custom fonts (Satoshi for headings, DM Sans for body, JetBrains Mono for code/numbers), crosshair cursor, and scroll-triggered fade-up animations with staggered delays.

## Landing Page Sections

### 1. Navbar
- Fixed top with glassmorphism (`backdrop-blur-xl`, semi-transparent background)
- "GENBOX" logo in lime green, bold uppercase tracking-widest
- "MASUK" button on the right (ghost style with border)

### 2. Hero Section
- Large gradient headline: **"Bikin Konten UGC Realistis. Tanpa Model, Tanpa Studio."**
- Subtitle explaining AI-generated UGC for Indonesian e-commerce sellers
- Glowing CTA button: **"BELI SEKARANG Rp 249.000"** with pulsing box-shadow animation
- Subtle grid pattern background with floating particle effects

### 3. Fitur Section (Features)
- Section badge + heading: "FITUR UNGGULAN"
- 6 feature cards in responsive grid (1/2/3 columns):
  - Karakter AI Konsisten, Prompt Generator Otomatis, UGC Hyper-Realistis, Hemat 90% Biaya, Pakai API Key Sendiri, Siap untuk Marketplace
- Each card: Lucide icon, title, description, hover scale + border glow

### 4. Cara Kerja Section (How It Works)
- 4 numbered steps with connecting visual elements:
  1. Beli Akses → 2. Login → 3. Setup API Key → 4. Generate
- Big mono numbers in lime, step descriptions below

### 5. Harga Section (Pricing)
- Single highlighted pricing card with lime border and glow shadow
- **"LIFETIME ACCESS — Rp 249.000"** (one-time payment)
- Feature checklist with checkmarks
- CTA button at bottom

### 6. FAQ Section
- Accordion with 8 questions covering: how GENBOX works, API key setup, API costs, what you get, refund policy, marketplace compatibility, etc.
- All in Bahasa Indonesia

### 7. Final CTA Section
- Bold "Mulai Sekarang" headline
- WhatsApp link button for purchase/support
- Subtle glow effects

## Animations & Polish
- Every section uses IntersectionObserver for scroll-triggered `animate-fade-up`
- Staggered animation delays on child elements
- CTA glow animation on buy buttons
- Floating background orbs (AnimatedBackground component)
- Hover effects on all interactive elements

