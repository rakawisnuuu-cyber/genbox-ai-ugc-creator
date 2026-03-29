

## Plan: Email Verification Modal + Rate Limit Fix

### 1. Increase email rate limit

**File: `supabase/config.toml`**
- Add `[auth]` section with `rate_limit.email_sent = 100` to prevent "email limit exceeded" errors during active signups.

### 2. Add verification guidance modal in Login.tsx

**File: `src/pages/Login.tsx`**

- Import `Dialog, DialogContent` from ui/dialog and `Mail, CheckCircle2, ArrowRight, RefreshCw` from lucide-react
- Add state: `showVerifyModal` (boolean), `registeredEmail` (string), `resendCooldown` (number)
- After successful signup (line 117): instead of toast + tab switch, set `registeredEmail` and `showVerifyModal = true`, clear form fields
- Add a Dialog modal containing:
  - Green checkmark icon + title "Akun Berhasil Dibuat!"
  - Mail icon + text: "Kami telah mengirim link verifikasi ke **{registeredEmail}**"
  - Step-by-step instructions: 1) Buka email, 2) Klik link verifikasi, 3) Kembali ke sini dan login
  - Tip: "Cek folder spam jika tidak menemukan email"
  - "Kirim Ulang Email" button with 60s cooldown timer — calls `supabase.auth.resend({ type: 'signup', email: registeredEmail })`
  - "Masuk Sekarang" button that closes modal, switches to login tab, pre-fills email field

### Files Changed

| File | Change |
|------|--------|
| `supabase/config.toml` | Add `[auth]` rate limit config |
| `src/pages/Login.tsx` | Add email verification modal with resend + guided steps |

