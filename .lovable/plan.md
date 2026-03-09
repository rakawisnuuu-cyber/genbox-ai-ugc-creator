

## Testing the Early Access Signup Flow

### Current Flow Analysis

The early access signup flow in `Login.tsx` works as follows:

1. User enters an invite code (validated against hardcoded list: `GENBOX-EA`, `EARLYBIRD`, `BETAUSER`)
2. User enters email + password (min 6 chars)
3. Calls `supabase.auth.signUp()` 
4. Shows "Akun berhasil dibuat! Silakan login" and switches to the login tab

### Potential Issue: Email Confirmation

The signup flow tells users to "Silakan login" immediately after signing up. However, by default, email confirmation is **required** — meaning users cannot log in until they click a verification link sent to their email.

This creates a broken experience: user signs up, switches to login tab, enters credentials, and gets an error because their email isn't confirmed yet.

### Recommended Fix

**Option A — Enable auto-confirm** (simplest, since this is an invite-only app with access codes):
- Use `configure_auth` tool to enable auto-confirm for email signups
- No code changes needed — the current flow will just work

**Option B — Update the success message** to tell users to check their email:
- Change toast message to "Cek email kamu untuk verifikasi akun sebelum login"
- Users must click the confirmation link before logging in

### Also Fix: Console Warning
The `AdminPage.tsx` has a React ref warning with `AlertDialog` — minor but should be fixed by ensuring `AlertDialog` wraps content correctly rather than being placed inside a `<td>`.

### Plan

1. **Enable auto-confirm** for email signups (since this is invite-code-gated, auto-confirm is safe)
2. **Fix AlertDialog ref warning** in AdminPage by moving the dialog outside the table cell

