

## Plan: Payment Flow to Clicky.id + Paid User System

### A) Redirect CTAs to Clicky.id

| File | Change |
|------|--------|
| `src/components/HargaSection.tsx` | Replace `<Link to="/checkout">` with `<a href="https://clicky.id/payment/purchase/69c292304cd72de65651417b" target="_blank" rel="noopener noreferrer">`. Remove `Link` import if unused. |
| `src/components/FinalCTASection.tsx` | Same — replace `<Link to="/checkout">` with `<a>` to Clicky URL. Remove `Link` import if unused. |
| `src/pages/CheckoutPage.tsx` | Replace entire page with a `useEffect` redirect + "Redirecting to payment..." loading spinner. |

### B) Database Migration

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'trial';
```

The admin UPDATE policy already exists (`"Admins can update profiles"`), so no new RLS needed.

### C) Admin Panel — Payments Tab

In `src/pages/AdminPage.tsx`:

- Add `"payments"` as default tab, with columns: Email, Signup, Plan, Status badge, Action
- Fetch same way as Trials tab — merge admin-users edge function data with profiles query (adding `is_paid, plan` to select)
- **Activate button**: green with CheckCircle2 icon, AlertDialog confirmation, updates `is_paid=true, plan='lifetime'`
- **Revoke button**: outline destructive, updates `is_paid=false, plan='trial'`
- Import `CheckCircle2, CreditCard` from lucide-react

### D) ProtectedRoute — Skip Trial for Paid Users

In `src/components/ProtectedRoute.tsx`:

- Query `trial_expires_at, is_paid` from profiles
- If `is_paid === true`, skip trial expiry check entirely
- Only check trial expiry when `is_paid` is false/null

### E) TrialBanner — Lifetime Badge

In `src/components/TrialBanner.tsx`:

- Query `is_paid` alongside `trial_expires_at`
- If `is_paid === true`, render green "Lifetime Access ✓" badge
- Otherwise show existing trial countdown

### F) TrialExpiredPage — Buy CTA

In `src/pages/TrialExpiredPage.tsx`:

- Add primary button "Beli GENBOX Lifetime — Rp 99.000" as `<a>` to Clicky URL, placed above WhatsApp button
- Import `ShoppingBag` or use existing icon

### Files Changed

| File | Type |
|------|------|
| `src/components/HargaSection.tsx` | Link → `<a>` |
| `src/components/FinalCTASection.tsx` | Link → `<a>` |
| `src/pages/CheckoutPage.tsx` | Full rewrite to redirect |
| DB migration | Add `is_paid`, `plan` columns |
| `src/pages/AdminPage.tsx` | Add Payments tab |
| `src/components/ProtectedRoute.tsx` | Check `is_paid` before trial |
| `src/components/TrialBanner.tsx` | Lifetime badge |
| `src/pages/TrialExpiredPage.tsx` | Add buy CTA |

