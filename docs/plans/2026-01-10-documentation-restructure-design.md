# Documentation Restructure Design

Split monolithic ARCHITECTURE.md into topic-focused files and add UI documentation.

## Goals

1. Keep CLAUDE.md compact as a routing table
2. Create focused, scannable topic files (~70-200 lines each)
3. Document the new UI service
4. Enable contextual drilling: minimal → practical → comprehensive

## New File Structure

```
docs/
├── CACHING.md      # GraphQL caching (Redis, response cache, field cache, DataLoaders)
├── TESTING.md      # TypeScript + Python testing (database isolation, fixtures, mocks)
├── PARSER.md       # Save file parsing (workflow, budget population, error handling)
├── AGENT.md        # Python budget agent (architecture, evals, tools)
├── UI.md           # React frontend (components, hooks, theming, subscriptions)
└── plans/          # Design documents (unchanged)
```

## Content Migration

### From ARCHITECTURE.md

| Section | Target File | ~Lines |
|---------|-------------|--------|
| GraphQL Caching System | CACHING.md | 70 |
| Testing Framework | TESTING.md | 130 |
| Python Unit Testing | TESTING.md | 50 |
| Parser System | PARSER.md | 100 |
| Budget Analysis Agent | AGENT.md | 100 |

ARCHITECTURE.md is deleted after migration.

### New UI.md Content

```markdown
# UI Architecture

React frontend for Stellaris statistics with real-time updates.

## Tech Stack
- React 19 + Vite + TypeScript (strict)
- vanilla-extract for styling
- Apollo Client with graphql-ws subscriptions
- uPlot for time-series charts

## File Structure
ui/src/
  ├── components/     # React components
  ├── hooks/          # Custom hooks (useRealtimeBudget)
  ├── graphql/        # Queries, subscriptions, generated types
  ├── styles/         # Theme tokens and global styles
  └── lib/            # Apollo client setup

## Key Components
- SaveList: Displays available saves, handles selection
- BudgetDashboard: Main dashboard with resource charts
- TimeSeriesChart: uPlot wrapper for time-series visualization

## Data Flow
- Apollo Client configured in lib/apollo.ts
- Split link: HTTP for queries/mutations, WebSocket for subscriptions
- useRealtimeBudget hook: fetches initial data, subscribes to updates

## Theming System
- Theme tokens in styles/theme.css.ts (colors, fonts, spacing)
- Resource colors map Stellaris resources to UI colors
- Panel style provides consistent container styling

## Conventions
- Local state for chart data (not Apollo cache) for efficient uPlot updates
- Subscriptions for real-time features only
- vanilla-extract for all styling (no CSS files)
```

## CLAUDE.md Changes

Replace ARCHITECTURE.md reference with:

```markdown
## Detailed Documentation

Consult these when making significant changes to each system:

| Topic | File | When to read |
|-------|------|--------------|
| Caching | `docs/CACHING.md` | Modifying Redis, response cache, or DataLoaders |
| Testing | `docs/TESTING.md` | Adding tests, fixtures, or test infrastructure |
| Parser | `docs/PARSER.md` | Changing save file parsing or budget extraction |
| Agent | `docs/AGENT.md` | Working on Python budget agent or evals |
| UI | `docs/UI.md` | Frontend components, hooks, or styling |
```

## Implementation Steps

1. Create `docs/CACHING.md` from ARCHITECTURE.md "GraphQL Caching System" section
2. Create `docs/TESTING.md` from "Testing Framework" + "Python Unit Testing" sections
3. Create `docs/PARSER.md` from "Parser System" section
4. Create `docs/AGENT.md` from "Budget Analysis Agent" section
5. Create `docs/UI.md` with new UI documentation
6. Update CLAUDE.md with routing table, remove ARCHITECTURE.md reference
7. Delete `docs/ARCHITECTURE.md`
