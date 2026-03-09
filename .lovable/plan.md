

## Security Hardening Plan

Three fixes to address the vulnerabilities identified:

### 1. Move invite codes to database
Create an `invite_codes` table and validate codes server-side via an Edge Function, instead of hardcoding them in the frontend JavaScript where anyone can read them.

- **New table**: `invite_codes` with columns: `id`, `code` (unique), `is_active`, `uses_remaining` (nullable), `created_at`
- **New Edge Function**: `validate-invite-code` — accepts a code, checks the DB, returns valid/invalid
- **Seed data**: Insert current codes (`GENBOX-EA`, `EARLYBIRD`, `BETAUSER`) into the table
- **Update `Login.tsx`**: Remove hardcoded `VALID_CODES` array; call the edge function to validate before signup
- **Admin UI addition**: Add an "Invite Codes" tab in AdminPage to create/disable codes

### 2. Protect `/admin` route for non-admin users
- Create an `AdminRoute` wrapper component that checks `useIsAdmin()` and redirects non-admin users to `/dashboard`
- Wrap the `/admin` route in `App.tsx` with this component

### 3. Add signup rate limiting
- In the new `validate-invite-code` Edge Function, add basic rate limiting by tracking attempts per IP or email in a simple check (e.g., limit to 5 signup attempts per hour per email)
- Alternatively, decrement `uses_remaining` on the invite code to cap total uses

### Files changed
- **New**: `supabase/functions/validate-invite-code/index.ts`
- **New**: `src/components/AdminRoute.tsx`
- **New migration**: Create `invite_codes` table + seed data
- **Edit**: `src/pages/Login.tsx` — remove hardcoded codes, call edge function
- **Edit**: `src/pages/AdminPage.tsx` — add invite codes management tab
- **Edit**: `src/App.tsx` — wrap admin route with `AdminRoute`
- **Edit**: `supabase/config.toml` — add new function config

