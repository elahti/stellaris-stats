# Documentation Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refresh all documentation files to be accurate, non-duplicative, and optimized for AI consumption.

**Architecture:** Sequential file updates with verification against actual codebase. Each file is verified then committed independently.

**Tech Stack:** Markdown, shell commands for verification

**Design:** See `docs/plans/2026-01-13-documentation-refresh-design.md`

---

### Task 1: Fix CLAUDE.md Path Error

**Files:**

- Modify: `CLAUDE.md:153`

**Step 1: Fix the wrong path**

Change line 153 from:

```markdown
4. **Sandbox agent prompts**: If `BudgetEntry` or `BudgetCategory` fields change, update `RESOURCE_FIELDS` and `BUDGET_CATEGORIES` in `agent/src/agent/sandbox_budget_agent/prompts.py`
```

To:

```markdown
4. **Sandbox agent prompts**: If `BudgetEntry` or `BudgetCategory` fields change, update `RESOURCE_FIELDS` and `BUDGET_CATEGORIES` in `agent/src/agent/sandbox/prompts.py`
```

**Step 2: Verify the path exists**

Run: `ls agent/src/agent/sandbox/prompts.py`
Expected: File exists

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(CLAUDE.md): fix sandbox agent path"
```

---

### Task 2: Verify CLAUDE.md Commands

**Files:**

- Read: `CLAUDE.md`
- Read: `package.json`

**Step 1: Extract all npm commands from CLAUDE.md**

Grep for commands mentioned in CLAUDE.md tables and verify each exists in package.json scripts.

Commands to verify:

- `npm run build`
- `npm run graphql:codegen`
- `npm run lint:typescript`
- `npm run test:typescript`
- `npm run test:ci:typescript`
- `npm run parser:run`
- `npm run ui:dev`
- `npm run ui:build`
- `npm run ui:preview`
- `npm run ui:codegen`
- `npm run test:ci:e2e`
- `npm run test:e2e:ui`
- `npm run graphql:codegen:python`
- `npm run typecheck:python`
- `npm run lint:python`
- `npm run format:python`
- `npm run agent:list-saves`
- `npm run agent:list-models`
- `npm run agent:analyze`
- `npm run agent:evals`
- `npm run agent:generate-fixture`
- `npm run test:python`
- `npm run test:ci:python`

**Step 2: Verify each command exists**

Run: `grep -E "\"(build|graphql:codegen|lint:typescript)\":" package.json`

Check all commands exist. If any are missing or renamed, note them for fixing.

**Step 3: If changes needed, fix and commit**

Only commit if changes were required. Otherwise, proceed to next task.

---

### Task 3: Verify CLAUDE.md File Paths

**Files:**

- Read: `CLAUDE.md`

**Step 1: Verify paths in GraphQL Schema Changes section**

Paths to verify:

- `src/db/budget.ts` (getBudgetBatchQuery)
- `grafana/*.json`
- `agent/queries.graphql`
- `agent/src/agent/sandbox/prompts.py` (already fixed in Task 1)

Run: `ls src/db/budget.ts agent/queries.graphql`
Expected: Both files exist

**Step 2: Verify project structure paths**

Paths mentioned:

- `src/` - TypeScript source
- `src/db/` - Database utilities
- `src/graphql/` - GraphQL server
- `src/parser/` - Save file parsing
- `src/scripts/` - Utility scripts
- `ui/` - React frontend
- `ui/src/components/`
- `ui/src/hooks/`
- `ui/src/lib/`
- `ui/src/styles/`
- `agent/src/agent/` - Python agent
- `migrations/`
- `graphql/`
- `grafana/`
- `tests/`
- `docs/`

Run: `ls -d src/ src/db/ src/graphql/ src/parser/ ui/ agent/src/agent/ migrations/ graphql/ tests/ docs/`
Expected: All directories exist

**Step 3: Commit if any fixes made**

Only if changes were required.

---

### Task 4: Rewrite docs/AGENT.md

**Files:**

- Rewrite: `docs/AGENT.md`

**Step 1: Write the new AGENT.md**

Replace entire file with new structure:

````markdown
# Budget Analysis Agent System

The agent system provides AI-powered analysis of Stellaris empire budget data. Multiple agent implementations exist for different analysis approaches.

## Agent Types

| Agent             | Directory                            | Purpose                                         |
| ----------------- | ------------------------------------ | ----------------------------------------------- |
| native_budget     | `agent/src/agent/native_budget/`     | pydantic-ai agent with native Python tools      |
| sandbox           | `agent/src/agent/sandbox/`           | Uses MCP python executor for sandboxed analysis |
| neighbor_single   | `agent/src/agent/neighbor_single/`   | Single-agent neighbor empire analysis           |
| neighbor_multi    | `agent/src/agent/neighbor_multi/`    | Multi-agent orchestrated neighbor analysis      |
| root_cause_single | `agent/src/agent/root_cause_single/` | Single-agent root cause analysis                |
| root_cause_multi  | `agent/src/agent/root_cause_multi/`  | Multi-agent orchestrated root cause analysis    |

## Shared Patterns

### Lazy Agent Initialization

Agents must be lazily initialized to allow utility commands (`list-models`, `--help`) to work without API keys. See the code example in `CLAUDE.md` under "Python Agent Pattern".

### Dependency Injection

All agents use an `AgentDeps` dataclass for dependency injection:

```python
@dataclass
class AgentDeps:
    client: GraphQLClientProtocol
```
````

This allows swapping the GraphQL client for testing (MockClient) or production (real client).

### Structured Output

Agents return Pydantic models for type-safe structured output:

```python
class SuddenDropAnalysisResult(BaseModel):
    save_filename: str
    analysis_period_start: str
    analysis_period_end: str
    sudden_drops: list[SuddenDrop]
    summary: str
```

### GraphQL Data Fetching

Agents fetch data via the generated GraphQL client in `agent/src/agent/graphql_client/`. Queries are defined in `agent/queries.graphql`.

## Running Agents

See the Python commands table in `CLAUDE.md`. Key commands:

- `npm run agent:analyze -- --type budget --save <filename>`
- `npm run agent:analyze -- --type neighbors --save <filename>`
- `npm run agent:list-saves`
- `npm run agent:list-models`

## Running Evals

Discover available datasets:

```bash
npm run agent:evals -- --list-datasets
```

Run a specific dataset:

```bash
npm run agent:evals -- --dataset <name>
```

For eval infrastructure details (template databases, fixtures, runners), see `docs/TESTING.md`.

## Adding New Agents

Follow the existing agent structure:

1. Create directory under `agent/src/agent/<agent_name>/`
2. Add `__init__.py` with public exports
3. Add `agent.py` with lazy initialization pattern
4. Add `models.py` for Pydantic input/output models
5. Add `prompts.py` if agent needs dynamic prompts
6. Register in CLI if needed (`agent/src/agent/cli.py`)
7. Add eval dataset and runner if testing agent behavior

````

**Step 2: Verify all paths in new doc exist**

Run: `ls -d agent/src/agent/native_budget/ agent/src/agent/sandbox/ agent/src/agent/neighbor_single/ agent/src/agent/neighbor_multi/ agent/src/agent/root_cause_single/ agent/src/agent/root_cause_multi/`
Expected: All directories exist

**Step 3: Commit**

```bash
git add docs/AGENT.md
git commit -m "docs(AGENT.md): rewrite with accurate agent architecture"
````

---

### Task 5: Update docs/TESTING.md Python Test Section

**Files:**

- Modify: `docs/TESTING.md:199-207`

**Step 1: Replace the test files table**

Find and replace the section "### Test Files" (approximately lines 199-207) with:

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

- **Error handling**: Edge cases and error conditions
  - Pattern: `test_error_handling.py`, `test_output_mode.py`

Run `ls agent/tests/` to see current test files.
```

**Step 2: Verify test patterns match actual files**

Run: `ls agent/tests/test_*.py`
Expected: Files match the patterns described

**Step 3: Commit**

```bash
git add docs/TESTING.md
git commit -m "docs(TESTING.md): replace test file table with category-based docs"
```

---

### Task 6: Update docs/UI.md File Structure

**Files:**

- Modify: `docs/UI.md:14-33`

**Step 1: Replace file tree with prose**

Find the "## File Structure" section and replace the file tree (`ui/src/...`) with:

```markdown
## File Organization

Components live in `ui/src/components/` with co-located `.css.ts` style files (vanilla-extract). Each component follows the `ComponentName.tsx` + `ComponentName.css.ts` naming pattern.

GraphQL operations are defined in `ui/src/graphql/*.graphql` with generated types output to `ui/src/graphql/generated/`.

Custom hooks live in `ui/src/hooks/`. The Apollo Client configuration is in `ui/src/lib/apollo.ts`.

Theme tokens and global styles are in `ui/src/styles/`:

- `theme.css.ts` — Theme variables (`vars.color`, `vars.space`, etc.)
- `global.css.ts` — Global styles applied to the app

Use `vars` from `theme.css.ts` for all styling values (never hardcode colors or spacing).
```

**Step 2: Verify the described structure**

Run: `ls ui/src/components/*.tsx ui/src/components/*.css.ts ui/src/graphql/*.graphql ui/src/hooks/*.ts ui/src/lib/apollo.ts ui/src/styles/*.css.ts`
Expected: Files exist matching the description

**Step 3: Commit**

```bash
git add docs/UI.md
git commit -m "docs(UI.md): replace file tree with prose description"
```

---

### Task 7: Verify docs/CACHING.md

**Files:**

- Read: `docs/CACHING.md`

**Step 1: Verify file paths**

Paths to verify:

- `src/graphql/responseCache.ts`
- `src/graphql/generated/Gamestate.ts`
- `src/graphql/dataloaders/`
- `src/redis.ts`
- `graphql/schema.graphql`

Run: `ls src/graphql/responseCache.ts src/redis.ts src/graphql/dataloaders/ graphql/schema.graphql`

**Step 2: Check for Gamestate.ts or equivalent**

Run: `ls src/graphql/generated/`

Note: Generated file structure may differ. Verify budget/planets caching is documented accurately.

**Step 3: Commit if fixes needed**

Only if changes were required.

---

### Task 8: Verify docs/PARSER.md

**Files:**

- Read: `docs/PARSER.md`

**Step 1: Verify file paths**

Paths to verify:

- `src/parser/parserConfig.ts`
- `src/parser/parserMain.ts`
- `src/parser/gamestateReader.ts`
- `src/parser/parserOptions.ts`
- `src/db/save.ts`
- `src/db/gamestates.ts`
- `src/db/budget.ts`

Run: `ls src/parser/parserConfig.ts src/parser/parserMain.ts src/parser/gamestateReader.ts src/db/save.ts src/db/gamestates.ts src/db/budget.ts`

**Step 2: Verify function names exist**

Key functions mentioned:

- `upsertSave` in `src/db/save.ts`
- `getGamestateByMonth` in `src/db/gamestates.ts`
- `insertGamestate` in `src/db/gamestates.ts`
- `populateBudgetTables` in `src/db/budget.ts`

Run: `grep -l "upsertSave\|getGamestateByMonth\|insertGamestate\|populateBudgetTables" src/db/*.ts`

**Step 3: Commit if fixes needed**

Only if changes were required.

---

### Task 9: Final Review and Summary Commit

**Step 1: Run git status**

Verify all changes are committed.

**Step 2: Review commit log**

Run: `git log --oneline -10`

Expected: See individual commits for each doc file modified.

**Step 3: Summary**

Document refresh complete. Files updated:

- `CLAUDE.md` — Fixed path
- `docs/AGENT.md` — Major rewrite
- `docs/TESTING.md` — Test section updated
- `docs/UI.md` — File structure updated
- `docs/CACHING.md` — Verified (changes if needed)
- `docs/PARSER.md` — Verified (changes if needed)
