

## Plan: Update Payment URL

Replace the old Clicky.id payment URL with the new one (`https://clicky.id/rkaaw/link/ugc-genboxid`) in all 4 files:

| File | Line | Change |
|------|------|--------|
| `src/components/HargaSection.tsx` | 92 | Update href |
| `src/components/FinalCTASection.tsx` | 45 | Update href |
| `src/pages/CheckoutPage.tsx` | 3 | Update `CLICKY_URL` constant |
| `src/pages/TrialExpiredPage.tsx` | 6 | Update `CLICKY_URL` constant |

All instances of `https://clicky.id/payment/purchase/69c292304cd72de65651417b` → `https://clicky.id/rkaaw/link/ugc-genboxid`.

