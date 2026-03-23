

## Plan: Codebase Audit & Optimization (Revised)

Same as previously approved plan with one change: **keep `src/components/ui/table.tsx`**.

### Files to Delete (~26 files)

**Orphaned files (6):**
- `src/pages/Dashboard.tsx`, `src/pages/BlueprintPage.tsx`, `src/lib/prompt-blocks.ts`, `src/lib/generate-types.ts`, `src/App.css`, `src/components/ui/use-toast.ts`

**Unused UI components (20 — table.tsx preserved):**
- form, resizable, input-otp, carousel, chart, context-menu, hover-card, menubar, navigation-menu, breadcrumb, command, pagination, calendar, aspect-ratio, popover, scroll-area, collapsible, checkbox, toggle-group, sidebar

### Other changes (unchanged from approved plan)
- Remove ~10 unused npm packages
- Clean 3 dead imports (TransactionPopup, BlueprintPage, backendConfig)
- Remove ~112 console.logs
- Delete backendConfig.ts + its import in main.tsx

### Zero behavior/visual changes

