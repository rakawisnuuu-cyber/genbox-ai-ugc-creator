

## Fix: 404 on /generate and /video routes

### Root Cause
`DashboardLayout` renders `GeneratePage` and `VideoPage` as keep-alive components (always mounted, toggled via `display`), but `App.tsx` has no `<Route>` definitions for `/generate` or `/video` inside the protected layout. React Router can't match these paths, so the wildcard `*` route shows 404.

### Fix (`src/App.tsx`)
Add two placeholder routes inside the protected `<Route>` group:

```tsx
<Route path="/generate" element={null} />
<Route path="/video" element={null} />
```

These render nothing (since the actual components are already mounted in `DashboardLayout`), but they tell React Router these are valid paths — preventing the 404 fallthrough.

Single file, 2 lines added.

