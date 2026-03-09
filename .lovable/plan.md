
Goal: fix signup failure (`"Failed to send a request to the Edge Function"`) on invite-code validation.

What I found from investigation:
- `src/pages/Login.tsx` calls `supabase.functions.invoke("validate-invite-code")` before signup.
- The error shown in your screenshot is a **network/preflight-level function invoke error**, not an “invalid code” business error.
- `validate-invite-code` function exists and is callable from backend tooling, so deployment is present.
- Current function CORS headers are hardcoded. With current `supabase-js` versions, header drift can cause preflight mismatch and produce exactly this error.
- Invite code data exists; `LETTSGOO` is active, so this is not mainly a “code missing” issue.

Do I know what the issue is?
- Yes: most likely CORS/preflight mismatch on Edge Function invocation from browser (not invite-code logic).

Implementation plan:

1) Harden CORS in edge functions (primary fix)
- Update `supabase/functions/validate-invite-code/index.ts` to use modern CORS handling compatible with current SDK headers.
- Return proper OPTIONS response including:
  - `Access-Control-Allow-Origin`
  - `Access-Control-Allow-Headers` (dynamic or SDK-provided)
  - `Access-Control-Allow-Methods`
- Keep JSON responses always merged with CORS headers.
- Apply same CORS normalization to `supabase/functions/admin-users/index.ts` so all function calls are consistent.

2) Improve signup error handling in UI
- In `src/pages/Login.tsx`, keep existing validation flow but improve error mapping:
  - Distinguish fetch/preflight errors from invalid invite code.
  - Show a clearer toast for network/function reachability issues (instead of “Kode tidak valid” for every case).
- Keep `console.log`/`console.error` around function response while we verify fix.

3) Add a safe fallback path (if needed)
- If function invoke still fails in some environments, add fallback validation through backend RPC (security-definer function) to avoid browser function CORS dependency.
- This fallback is only phase 2 if phase 1 does not fully resolve.

4) Verification checklist (end-to-end)
- From logged-out state on `/login`, test signup tab with:
  - valid code (`LETTSGOO`) + new email/password → should proceed to account creation
  - invalid code → should show invalid-code toast
  - network/function failure simulation → should show network-specific toast
- Confirm no regression on `/admin` function calls after CORS normalization.

Technical details:
- Files to update:
  - `supabase/functions/validate-invite-code/index.ts`
  - `supabase/functions/admin-users/index.ts`
  - `src/pages/Login.tsx`
- Database migration:
  - Not required for primary fix.
  - Only needed if we add RPC fallback.
- Security:
  - Keep invite-code verification server-side.
  - Do not move validation to client-side table reads.
