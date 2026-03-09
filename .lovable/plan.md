
Goal: fix “Invalid credentials” only on Vercel (while login works on Lovable preview).

What I confirmed:
- Auth works correctly in current app environment:
  - `/auth/v1/token` returns 200 for admin login.
  - `has_role` returns `true` for your admin user.
  - Invite-code validation returns `{ valid: true }`.
- From your clarification:
  - Vercel has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` set.
  - Error shown on Vercel is specifically “Invalid credentials”.

Do I know what the issue is?
- Yes. This is most likely an environment mismatch (Vercel pointing to a different backend/auth environment than the one where your admin account exists), not a password bug in the login code.

Implementation plan:

1) Add deployment-safe auth diagnostics in UI (to remove guesswork)
- File: `src/pages/Login.tsx`
- Add non-sensitive debug logging on login attempt:
  - `window.location.origin`
  - backend host from `VITE_SUPABASE_URL` (host only)
  - key fingerprint (masked: first/last chars only, never full key)
- Improve login error mapping:
  - For `Invalid login credentials`, show message:
    “Email/password salah ATAU akun belum ada di environment backend ini.”
  - Keep existing invite-code network/business error separation.

2) Add runtime config guard (early warning on wrong Vercel env)
- Files: `src/lib/backendConfig.ts` (new), `src/main.tsx` (or `AuthContext.tsx`)
- Validate at app startup:
  - `VITE_SUPABASE_URL` exists and is valid URL
  - `VITE_SUPABASE_PUBLISHABLE_KEY` exists
  - Optional consistency check: URL project ref matches `VITE_SUPABASE_PROJECT_ID` when provided
- If invalid/mismatch:
  - show clear console error + optional user-facing toast in `/login`.

3) Normalize credentials before auth call
- File: `src/pages/Login.tsx`
- Use:
  - `email.trim().toLowerCase()`
  - `signupEmail.trim().toLowerCase()`
- Prevent false “invalid credentials” from hidden spaces/case inconsistencies.

4) Vercel deployment alignment checklist (no code, operational)
- Re-enter env vars in Vercel for all scopes (Production + Preview + Development):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - (optional) `VITE_SUPABASE_PROJECT_ID`
- Ensure no extra quotes/spaces in values.
- Redeploy with cache cleared.
- Compare diagnostic output between Lovable and Vercel:
  - If backend host/fingerprint differ, that confirms wrong environment linkage.
- If host matches but still invalid credentials:
  - account does not exist in that environment’s auth data; create the user in that same environment.

Technical details:
- No database migration needed.
- No backend function changes needed for this issue.
- Files to update:
  - `src/pages/Login.tsx`
  - `src/main.tsx` or `src/contexts/AuthContext.tsx`
  - `src/lib/backendConfig.ts` (new helper)
- Security:
  - Never print full key/token.
  - Only masked diagnostics.
