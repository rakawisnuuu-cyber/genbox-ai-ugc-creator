

## Plan: BYOK Disclaimer Modal Before Purchase

### What
Create a reusable `BYOKDisclaimerModal` component that intercepts all "Beli" CTA clicks on the landing page. Instead of going directly to the payment URL, the modal explains the BYOK system and asks the user to acknowledge before proceeding.

### New File: `src/components/BYOKDisclaimerModal.tsx`

A Dialog-based modal component that receives `open`, `onOpenChange` props:

- **Header**: "⚠️ Baca Dulu Sebelum Beli!"
- **Amber/yellow disclaimer box** with rounded border, explaining:
  - Genbox pakai sistem BYOK (Bring Your Own Key)
  - Pembayaran di sini = akses ke platform Genbox saja
  - Biaya pemakaian API terpisah — dibayar langsung ke provider (Kie.ai / Google AI Studio)
- **Two buttons**:
  - Primary: "Saya Mengerti, Lanjut Beli →" — opens `https://clicky.id/rkaaw/link/ugc-genboxid` in new tab + closes modal
  - Secondary/outline: "Tanya Dulu" — opens `https://wa.me/6281234567890?text=Halo%2C%20saya%20mau%20tanya%20soal%20Genbox` in new tab

Uses existing Dialog component from `@/components/ui/dialog` with smooth animation. Amber accent via `bg-amber-500/10 border-amber-500/30 text-amber-200` for the warning box.

### Modified Files

| File | Change |
|------|--------|
| `src/components/HargaSection.tsx` | Replace `<a href="...">` CTA with a `<button>` that opens the disclaimer modal. Add modal state + render `BYOKDisclaimerModal`. |
| `src/components/FinalCTASection.tsx` | Same — replace direct link with button + modal. |

In both files: the `<a>` tag becomes a `<button>` with the same styling. `useState` controls modal visibility. The payment URL constant is passed to the modal or kept in the modal component itself.

### Files Changed

| File | Action |
|------|--------|
| `src/components/BYOKDisclaimerModal.tsx` | **Create** — reusable disclaimer modal |
| `src/components/HargaSection.tsx` | **Edit** — intercept CTA with modal |
| `src/components/FinalCTASection.tsx` | **Edit** — intercept CTA with modal |

