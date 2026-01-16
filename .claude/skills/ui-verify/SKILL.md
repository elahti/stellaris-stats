---
name: ui-verify
description: Use after completing UI work to verify code, tests, and component specs are in sync. Also use on-demand to audit UI consistency.
allowed-tools: Bash(npm run test:ci:e2e:*), Bash(npm run ui:dev:*), Bash(lsof -i:*), Bash(curl -s http://localhost:*), Bash(npx serve:*)
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

### Phase 1: Coverage Analysis (Subagent)

Launch an Explore subagent to analyze coverage. Use the Task tool with:

```
subagent_type: Explore
prompt: |
  Analyze UI component coverage for the Stellaris Stats project.

  Tasks:
  1. List all React components in ui/src/components/*.tsx
  2. List all HTML component specs in docs/components/*.html
  3. List all E2E test files in ui/playwright/tests/*.spec.ts
  4. Read docs/components/index.html to check which specs are linked
  5. For each E2E test file, identify which components are tested

  Build a coverage report with:
  - Table of components showing: Component Name | Has Spec? | Has Tests?
  - List of components missing specs
  - List of components missing test coverage
  - List of orphaned specs (spec exists but no component)
  - List of specs not linked in index.html

  Component naming conventions:
  - SaveList.tsx → save-item.html (component contains SaveItem elements)
  - ViewMenu.tsx → view-menu-sidebar.html, view-menu-item.html
  - SplashTitle.tsx → splash-title.html (direct 1:1)

  Return a structured markdown report.
```

Wait for the subagent to complete and capture its coverage report.

### Phase 2: Run E2E Tests

Run E2E tests directly (not in subagent, to show progress):

```bash
npm run test:ci:e2e
```

Capture and summarize results:
- Total tests run
- Passed/failed count
- List of failed test names (if any)
- Which components/features are affected by failures

### Phase 3: Visual Comparison

For each component that has BOTH a spec and implementation:

#### 3.1 Start Servers

1. **Check UI dev server**: Verify `localhost:5173` is running
   ```bash
   lsof -i:5173
   ```
   If not running, ask user if they want to start it.

2. **Start component spec server**: Serve the HTML specs on port 3333
   ```bash
   npx serve docs/components -p 3333 --no-clipboard
   ```
   Run this in background (`run_in_background: true`) so it keeps running during comparison.

   Verify it's ready:
   ```bash
   curl -s http://localhost:3333/ | head -5
   ```

#### 3.2 Compare Each Component

For each component with both spec and implementation:

1. **Open HTML spec**: Use `browser_navigate` to:
   ```
   http://localhost:3333/<component-name>.html
   ```
   Take a `browser_snapshot` to capture the spec appearance.

2. **Open production UI**: Navigate to `http://localhost:5173` and navigate to a view showing the component.
   Take a `browser_snapshot` to capture the production appearance.

3. **Compare visually**: Examine both snapshots and describe any differences:
   - Color mismatches (compare CSS variable values)
   - Spacing/sizing differences
   - Typography mismatches (font family, size, weight)
   - Missing states (hover, selected, disabled)
   - Structural differences (missing elements, wrong hierarchy)

#### 3.3 Cleanup

After visual comparison is complete, stop the spec server using `KillShell` with the task ID from the background bash command.

### Phase 4: Report & Offer Fixes

Compile all findings into a summary report:

```
## UI Verification Report

### Coverage (from subagent)
- Components: X total
- With specs: Y (Z%)
- With tests: W (V%)
- [Coverage table from subagent]

### E2E Tests
- Status: PASSED / FAILED
- Total: X tests
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

#### Implementing Fixes

When the user accepts a fix, invoke the `superpowers:brainstorming` skill to design and implement the fix. This ensures:
- Proper understanding of the fix scope
- User validation of the approach before implementation
- Quality implementation following project standards

Example flow:
1. User accepts "Create HTML spec from current implementation?"
2. Invoke `Skill(superpowers:brainstorming)` with the fix context
3. Follow brainstorming workflow to design the spec
4. Implement after user approval

## Quick Check Mode

If the user asks for a "quick check" or "fast verify":
- Run Phase 1 (subagent coverage analysis)
- Run Phase 2 (E2E tests)
- Skip Phase 3 (visual comparison)
- Run Phase 4 (report & offer fixes)

## Parallel Execution Option

For faster verification, you can run Phase 1 (subagent) and Phase 2 (E2E tests) in parallel:

1. Launch the Explore subagent with `run_in_background: true`
2. Start E2E tests immediately
3. After E2E tests complete, check subagent results with TaskOutput
4. Continue to Phase 3 with combined results

Use this when the user wants faster results and doesn't need to see coverage analysis progress.
