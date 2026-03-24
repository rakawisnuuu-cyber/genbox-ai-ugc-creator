

## Fix: Admin Page user deletion not working

**Root cause**: Method mismatch between frontend and edge function.

- **Frontend** (`AdminPage.tsx` line 133): calls `supabase.functions.invoke("admin-users", { method: "POST", body: { action: "delete", user_id } })`
- **Edge function** (`admin-users/index.ts` line 63): expects `req.method === "DELETE"` with `{ user_id }` in body

The POST request hits the "Method not allowed" branch (line 86), returning a 405 error.

### Fix

**Option A (simplest)**: Change the frontend `handleDelete` to use `method: "DELETE"`:

```typescript
const { data, error } = await supabase.functions.invoke("admin-users", {
  method: "DELETE",
  body: { user_id: userId },
});
```

Remove the `action: "delete"` field since the edge function doesn't use it.

### Files changed

| File | Change |
|------|--------|
| `src/pages/AdminPage.tsx` | Change `method: "POST"` → `method: "DELETE"` and remove `action` from body in `handleDelete` |

