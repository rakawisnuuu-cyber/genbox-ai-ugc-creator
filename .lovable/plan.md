

## Fix: Invite Code Validation Failing

**Root cause**: The `supabase.functions.invoke()` call likely returns `data` in a format where `.valid` isn't directly accessible, or there's a subtle error being thrown. The edge function itself works correctly (tested and returns `{"valid": true}` for EARLYBIRD).

**Fix approach**: Add better error handling and logging to diagnose, and ensure the response is properly parsed:

### Changes to `src/pages/Login.tsx`
1. Add `console.log` for debugging the actual response shape from `supabase.functions.invoke`
2. Handle the case where `data` might need explicit JSON parsing (some versions of the Supabase client return raw responses)
3. Improve error handling to show the actual error message instead of a generic one

```typescript
const { data: codeResult, error: codeError } = await supabase.functions.invoke("validate-invite-code", {
  body: { code: inviteCode.trim(), email: signupEmail },
});

console.log("Invite code validation:", { codeResult, codeError });

if (codeError) {
  setSignupLoading(false);
  toast({ title: "Kode tidak valid", description: codeError.message || "Gagal memvalidasi kode.", variant: "destructive" });
  return;
}

if (!codeResult?.valid) {
  setSignupLoading(false);
  toast({ title: "Kode tidak valid", description: codeResult?.error || "Kode akses tidak valid.", variant: "destructive" });
  return;
}
```

This separates the `codeError` (network/function error) from `codeResult` (business logic) checks, making it clearer what's failing. The console log will help identify the exact response shape if the issue persists.

