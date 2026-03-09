

## Plan: Admin Panel with User Management

### Overview
Create an admin-only page at `/admin` that lists all registered users and allows deleting them. Since we cannot query `auth.users` from the client, we need an Edge Function that uses the service role key to list and delete users via the Supabase Admin API.

### Security Model
- Hardcode your user ID (the admin) in the Edge Function — only that user can call it
- No roles table needed for a single-admin setup
- Edge Function validates the caller's JWT and checks against the hardcoded admin ID

### Components

**1. Edge Function: `admin-users`**
- Path: `supabase/functions/admin-users/index.ts`
- `GET` — calls `supabase.auth.admin.listUsers()`, returns user list (id, email, created_at, last_sign_in_at)
- `DELETE` — accepts `{ user_id }` body, calls `supabase.auth.admin.deleteUser(user_id)`, returns success
- Auth: extracts JWT from `Authorization` header, uses `getClaims()` to get caller's `sub`, compares against hardcoded admin user ID
- Uses `SUPABASE_SERVICE_ROLE_KEY` (already in secrets) to create an admin client
- Config: `verify_jwt = false` in `config.toml`

**2. Admin Page: `src/pages/AdminPage.tsx`**
- Table showing: Email, Created At, Last Sign In, Delete button
- Delete triggers an AlertDialog confirmation before calling the edge function
- Loading/empty states
- Calls edge function via `supabase.functions.invoke('admin-users')`

**3. Routing: `src/App.tsx`**
- Add `/admin` route inside the protected `DashboardLayout` block

**4. Navigation**
- Add "Admin" nav item in `DashboardLayout.tsx` under a new "ADMIN" group (only visible, but access is truly gated by the edge function)

### Files to create/edit
- **Create**: `supabase/functions/admin-users/index.ts`
- **Create**: `src/pages/AdminPage.tsx`
- **Edit**: `supabase/config.toml` — add `[functions.admin-users]` with `verify_jwt = false`
- **Edit**: `src/App.tsx` — add admin route
- **Edit**: `src/components/DashboardLayout.tsx` — add admin nav item

