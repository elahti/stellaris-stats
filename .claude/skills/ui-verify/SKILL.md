---
name: ui-verify
description: Use after completing UI work to verify code, tests, and component specs are in sync. Also use on-demand to audit UI consistency.
allowed-tools: Bash(npm run test:ci:e2e:*), Bash(npm run ui:dev:*), Bash(lsof -i:*), Bash(curl -s http://localhost:*)
model: claude-opus-4-5-20251101
user-invocable: true
---

# UI Verification

Verify that production UI code, E2E tests, and HTML component library are synchronized.

## When to Use

- After completing any UI work (before committing)
- On-demand when you want to audit UI consistency
- When reviewing someone else's UI changes

## Verification Workflow

Execute these phases in order. Report all findings, then offer fixes.

### Phase 1: Gather State

Collect inventory of all UI artifacts:

1. **React Components**: Use Glob to list `ui/src/components/*.tsx`
2. **Component Specs**: Use Glob to list `docs/components/*.html`
3. **E2E Tests**: Use Glob to list `ui/playwright/tests/*.spec.ts`

Build a table showing what exists:

| Component | Has Spec? | Has Tests? |
|-----------|-----------|------------|
| SaveList  | Yes/No    | Yes/No     |
| ...       | ...       | ...        |

### Phase 2: Coverage Analysis

Identify gaps:

1. **Components without specs**: React components in `ui/src/components/` that lack a corresponding HTML file in `docs/components/`
2. **Components without tests**: Components not referenced in any E2E test file
3. **Orphaned specs**: HTML specs in `docs/components/` without corresponding React components
4. **Index completeness**: Check `docs/components/index.html` links to all spec files

Read the component files and spec files to verify naming conventions align (e.g., `SaveList.tsx` → `save-list.html` or similar).

### Phase 3: Run E2E Tests

1. Run E2E tests:
   ```bash
   npm run test:ci:e2e
   ```

2. Capture and summarize results:
   - Total tests run
   - Passed/failed count
   - List of failed test names (if any)

3. If tests fail, note which components/features are affected

### Phase 4: Visual Comparison

For each component that has BOTH a spec and implementation:

1. **Check dev server**: Verify `localhost:5173` is running
   ```bash
   lsof -i:5173
   ```
   If not running, ask user if they want to start it.

2. **Open HTML spec**: Use `browser_navigate` to open the spec file:
   ```
   file:///workspace/docs/components/<component-name>.html
   ```
   Take a `browser_snapshot` to capture the spec appearance.

3. **Open production UI**: Navigate to `http://localhost:5173` and navigate to a view showing the component.
   Take a `browser_snapshot` to capture the production appearance.

4. **Compare visually**: Examine both snapshots and describe any differences:
   - Color mismatches (compare CSS variable values)
   - Spacing/sizing differences
   - Typography mismatches (font family, size, weight)
   - Missing states (hover, selected, disabled)
   - Structural differences (missing elements, wrong hierarchy)

### Phase 5: Report & Offer Fixes

Generate a summary report:

```
## UI Verification Report

### Coverage
- Components: X total
- With specs: Y (Z%)
- With tests: W (V%)

### E2E Tests
- Status: PASSED / FAILED
- Failures: [list if any]

### Visual Consistency
- Components checked: N
- Mismatches found: M
- [Details of each mismatch]

### Issues Found
1. [Issue description]
2. [Issue description]
```

For each issue, offer a specific fix using AskUserQuestion:

| Issue Type | Offered Fix |
|------------|-------------|
| Component missing spec | "Create HTML spec from current implementation?" |
| Component missing tests | "Generate E2E test stub for this component?" |
| Spec not in index.html | "Add link to docs/components/index.html?" |
| Orphaned spec | "Remove spec file (component no longer exists)?" |
| Visual mismatch | "Which should be the source of truth: (A) Update spec to match implementation, (B) Update implementation to match spec?" |
| E2E test failure | "Investigate and fix failing tests?" |

## Quick Check Mode

If the user asks for a "quick check" or "fast verify", skip Phase 4 (visual comparison) and only run Phases 1-3 and 5.

## Component Naming Conventions

Map between file names:

| React Component | Spec File | Relationship |
|-----------------|-----------|--------------|
| `SaveList.tsx` | `save-item.html` | Component contains SaveItem elements |
| `ViewMenu.tsx` | `view-menu-sidebar.html`, `view-menu-item.html` | Component uses both specs |
| `SplashTitle.tsx` | `splash-title.html` | Direct 1:1 mapping |

When checking coverage, account for these relationships—a component may use multiple specs or a spec may document a sub-component.
