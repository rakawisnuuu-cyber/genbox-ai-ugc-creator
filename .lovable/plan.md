

## Admin Panel — Implementation Plan

Your admin user ID is: `5a504b23-c86d-419c-ae65-5ce4dd439701`

### What gets built

1. **Edge Function `admin-users`** — backend function that uses the service role key to list and delete users. Only your user ID is authorized to call it.

2. **Admin Page (`/admin`)** — table showing all users (email, created date, last sign-in) with a delete button + confirmation dialog.

3. **Routing & Navigation** — `/admin` added as a protected route, "Admin" link added to the sidebar under an "ADMIN" group with a Shield icon.

### Files

| Action | File |
|--------|------|
| Create | `supabase/functions/admin-users/index.ts` |
| Create | `src/pages/AdminPage.tsx` |
| Edit   | `supabase/config.toml` — add `[functions.admin-users]` with `verify_jwt = false` |
| Edit   | `src/App.tsx` — add `/admin` route |
| Edit   | `src/components/DashboardLayout.tsx` — add Admin nav item |

### Security

- Edge function checks the caller's JWT `sub` against hardcoded admin ID `5a504b23-c86d-419c-ae65-5ce4dd439701`
- Returns 403 for any other user
- Uses `SUPABASE_SERVICE_ROLE_KEY` (already configured) for admin API calls
- No database changes needed

