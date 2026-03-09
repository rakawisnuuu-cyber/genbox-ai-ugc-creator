

## Plan: Early Access Invite Code System + Vercel Deployment Guide

### 1. Vercel Deployment Guide

Lovable projects are Vite + React apps. To deploy on Vercel:

1. Connect your GitHub repo to Vercel (go to Settings → GitHub in Lovable to push code to GitHub first)
2. In Vercel, import the repo. Framework preset: **Vite**. Build command: `npm run build`. Output dir: `dist`
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
4. Deploy. For SPA routing, add a `vercel.json` with rewrites:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```

### 2. Early Access Signup — `src/pages/Login.tsx`

**Single file edit.** Add tab toggle between Login and Signup within the existing card:

- **State**: Add `activeTab` (`"login" | "signup"`), plus `signupEmail`, `signupPassword`, `inviteCode` states
- **Invite codes**: Hardcoded array `["GENBOX-EA", "EARLYBIRD", "BETAUSER"]`, validated client-side (case-insensitive)
- **Signup handler**: Validate invite code → validate password length (min 6) → call `supabase.auth.signUp({ email, password })` → on success, toast and switch to login tab
- **UI**: Below the logo/heading area, render two tab buttons ("Masuk" / "Daftar Early Access"). Signup tab shows a small badge "Early Access — Kuota Terbatas" in primary color. Form fields: Kode Akses, Email, Password — same input styling as login form
- **Auth config**: Enable auto-confirm for email signups (since this is early access with invite codes, no email verification needed) using `configure_auth` tool

### Files to edit
- `src/pages/Login.tsx` — add signup tab with invite code validation
- `vercel.json` — create for SPA routing

### Backend change
- Enable auto-confirm email signups so early access users can log in immediately after signup

