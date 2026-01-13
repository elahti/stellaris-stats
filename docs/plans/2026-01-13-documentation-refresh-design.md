# Documentation Refresh Design

## Overview

Comprehensive refresh of all documentation files to ensure accuracy, remove duplication, and optimize for AI consumption.

## Scope

### Files to Modify

| File              | Change Type                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `CLAUDE.md`       | Fix wrong path, verify all paths/commands, check for duplication |
| `docs/AGENT.md`   | Major rewrite — overview + patterns structure                    |
| `docs/TESTING.md` | Replace Python test file table with category-based approach      |
| `docs/UI.md`      | Replace file tree with prose descriptions                        |
| `docs/CACHING.md` | Verify accuracy (likely no changes)                              |
| `docs/PARSER.md`  | Verify accuracy (likely no changes)                              |

### Out of Scope

- `docs/plans/` — Historical implementation plans, not reference docs
- Creating new documentation files
- Restructuring the docs/ folder

## Guiding Principles

- Optimize for AI consumption (clear directives, accurate paths)
- Code is source of truth for details (env vars, file listings)
- Avoid duplication between CLAUDE.md and detailed docs
- Patterns over exhaustive listings
- No specific env var documentation (user responsibility)

## Changes by File

### CLAUDE.md

**Fix required:**

- Line 153: `agent/src/agent/sandbox_budget_agent/prompts.py` → `agent/src/agent/sandbox/prompts.py`

**Verification pass:**

- All npm script commands in tables (compare against `package.json`)
- File paths in "GraphQL Schema Changes" section
- Project structure diagram paths
- Python agent pattern code example

**Consistency pass:**

- Commands: Keep full tables in CLAUDE.md only
- Lazy init pattern: Keep example in CLAUDE.md, reference from AGENT.md
- Git workflow: Correctly delegates to `/commit` skill, no changes needed

### docs/AGENT.md

**New structure:**

```
# Budget Analysis Agent System

## Overview
- Brief description of the agent system
- Multiple agent types for different analysis approaches

## Agent Types
| Agent | Directory | Purpose |
| native_budget | agent/src/agent/native_budget/ | pydantic-ai with native tools |
| sandbox | agent/src/agent/sandbox/ | MCP python executor approach |
| neighbor_single | agent/src/agent/neighbor_single/ | Single-agent neighbor analysis |
| neighbor_multi | agent/src/agent/neighbor_multi/ | Multi-agent neighbor analysis |
| root_cause_single | agent/src/agent/root_cause_single/ | Single-agent root cause |
| root_cause_multi | agent/src/agent/root_cause_multi/ | Multi-agent root cause |

## Shared Patterns
- Lazy initialization (reference CLAUDE.md example)
- AgentDeps dependency injection
- Structured output via Pydantic models
- GraphQL client for data fetching

## Running Agents
- Reference CLAUDE.md commands table
- Brief example only

## Running Evals
- Brief mention: `npm run agent:evals -- --list-datasets`
- Reference docs/TESTING.md for infrastructure details

## Adding New Agents
- Pattern to follow for new agent types
```

**Removed content:**

- Wrong paths (`budget_agent/`)
- Specific env var listings
- Detailed eval dataset documentation
- Duplicate "how to run" content

### docs/TESTING.md

**Replace Python test file table (lines 199-207) with:**

```markdown
### Test Categories

Tests are organized by what they verify:

- **Agent logic**: Tests for agent behavior, tool functions, orchestration
  - Pattern: `test_native_budget_agent*.py`, `test_orchestrator.py`

- **Evaluators**: Custom pydantic-evals evaluator logic
  - Pattern: `test_*evaluators.py`

- **Prompts**: Prompt building and formatting
  - Pattern: `test_*_prompts.py`

- **Models**: Pydantic model validation
  - Pattern: `test_*models.py`

- **Fixtures**: Fixture loading and generation
  - Pattern: `test_fixture_loader.py`, `test_generate_sql_fixture.py`

Run `ls agent/tests/` to see current test files.
```

**Unchanged sections:**

- TypeScript testing section
- Test infrastructure components
- Shared fixtures section
- Eval infrastructure section

### docs/UI.md

**Replace file tree (lines 14-33) with prose:**

```markdown
## File Organization

Components live in `ui/src/components/` with co-located `.css.ts` style files
(vanilla-extract). Each component has its own style file following the
`ComponentName.css.ts` naming pattern.

GraphQL operations are defined in `ui/src/graphql/*.graphql` with generated
types in `ui/src/graphql/generated/`.

Custom hooks live in `ui/src/hooks/`. The Apollo Client configuration is in
`ui/src/lib/apollo.ts`.

Theme tokens and global styles are in `ui/src/styles/` — use `vars` from
`theme.css.ts` for all styling values.
```

**Additional verification:**

- Component descriptions match actual components
- Hook descriptions match actual hooks
- E2E testing fixture paths are correct

### docs/CACHING.md

Verify accuracy of:

- File paths (`src/graphql/responseCache.ts`, `src/graphql/generated/Gamestate.ts`)
- DataLoader names and locations
- Redis configuration details

### docs/PARSER.md

Verify accuracy of:

- File paths (`src/parser/*.ts`, `src/db/*.ts`)
- Function names
- Database schema

## Execution Plan

1. CLAUDE.md — Fix path, verify all paths/commands
2. docs/AGENT.md — Major rewrite
3. docs/TESTING.md — Replace test file table
4. docs/UI.md — Replace file tree
5. docs/CACHING.md — Verification
6. docs/PARSER.md — Verification

## Verification Method

- For each path: confirm file exists
- For each command: confirm exists in `package.json`
- For code examples: confirm matches actual codebase patterns

## Commit Strategy

Single commit: `docs: comprehensive refresh of documentation`
