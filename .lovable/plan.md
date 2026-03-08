

## Keep Page State Alive Across Tab Navigation

### Problem
When navigating between dashboard tabs (e.g., `/generate` → `/video` → back), React Router unmounts the component and all `useState` is lost — including uploaded images, selected characters, generation results, and in-progress generation polling loops.

### Approach: Keep-Alive Rendering

Instead of relying on `<Outlet />` which unmounts inactive routes, render the heavy pages (`GeneratePage` and `VideoPage`) permanently inside `DashboardLayout` and toggle visibility with CSS `display: none`. Other lightweight pages continue using `<Outlet />`.

This preserves:
- All form state (uploaded images, character selection, settings)
- In-progress generation polling loops (they keep running in background)
- Generated results and storyboard state
- Video frame states and generated videos

### Plan

**File: `src/components/DashboardLayout.tsx`**

1. Import `GeneratePage` and `VideoPage` directly
2. In the main content area, render both pages permanently but wrap each in a `div` with `style={{ display: pathname === "/generate" ? "block" : "none" }}` (same for `/video`)
3. Only render `<Outlet />` when the current route is NOT `/generate` or `/video`
4. Update `isFullWidthPage` logic to apply correct container styling to the keep-alive wrappers independently

**File: `src/App.tsx`**

5. Remove the `<Route>` entries for `/generate` and `/video` from the nested dashboard routes since they're now rendered directly in `DashboardLayout`

### Result
- Generate and Video pages stay mounted across all tab switches
- Running generations continue in background
- All other pages work as before via Outlet

