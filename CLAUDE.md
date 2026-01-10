# CLAUDE.md

Instructions for Claude Code when working with this repository.

## Project Overview

GraphQL API for analyzing Stellaris game statistics. Parses save files (Clausewitz engine format), stores data in PostgreSQL, exposes via GraphQL with Redis caching.

## Project Structure

```
src/                    # TypeScript source
  db/                   # Database utilities
  graphql/              # GraphQL server & generated types
  parser/               # Save file parsing
  scripts/              # Utility scripts
ui/                     # React frontend
  src/components/       # React components
  src/hooks/            # Custom React hooks
  src/lib/              # Apollo Client config
  src/styles/           # vanilla-extract theme
agent/src/agent/        # Python budget analysis agent
migrations/             # Database migrations
graphql/                # GraphQL schema definitions
grafana/                # Dashboard configurations (see grafana/README.md)
tests/                  # Test files, utils, fixtures
docs/                   # Detailed documentation (see below)
```

## Detailed Documentation

Consult these when making significant changes to each system:

| Topic | File | When to read |
|-------|------|--------------|
| Caching | `docs/CACHING.md` | Modifying Redis, response cache, or DataLoaders |
| Testing | `docs/TESTING.md` | Adding tests, fixtures, or test infrastructure |
| Parser | `docs/PARSER.md` | Changing save file parsing or budget extraction |
| Agent | `docs/AGENT.md` | Working on Python budget agent or evals |
| UI | `docs/UI.md` | Frontend components, hooks, or styling |

## Commands

All commands run from `/workspace`.

### TypeScript

| Task                     | Command                         |
| ------------------------ | ------------------------------- |
| Build (includes codegen) | `npm run build`                 |
| GraphQL codegen only     | `npm run graphql:codegen`       |
| Lint                     | `npm run lint:typescript`       |
| Test (watch)             | `npm run test:typescript`       |
| Test (CI)                | `npm run test:ci:typescript`    |
| Run parser               | `npm run parser:run -- -g <id>` |
| List saves               | `npm run parser:run -- -l`      |

### UI (React)

| Task            | Command             |
| --------------- | ------------------- |
| Dev server      | `npm run ui:dev`    |
| Build           | `npm run ui:build`  |
| Preview build   | `npm run ui:preview`|
| GraphQL codegen | `npm run ui:codegen`|

### Python

| Task              | Command                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------- |
| Sync deps         | `cd agent && uv sync`                                                                       |
| GraphQL codegen   | `npm run graphql:codegen:python`                                                            |
| Type check        | `npm run typecheck:python`                                                                  |
| Lint              | `npm run lint:python`                                                                       |
| Format            | `npm run format:python`                                                                     |
| List saves        | `npm run agent:list-saves`                                                                  |
| List models       | `npm run agent:list-models`                                                                 |
| Analyze budget    | `npm run agent:analyze -- --type budget --save <filename>`                     |
| Analyze neighbors | `npm run agent:analyze -- --type neighbors --save <filename> [--agent-type single\|multi]` |
| Run evals         | `npm run agent:evals -- --dataset multi_agent_drop_detection`                                |
| Generate fixture  | `npm run agent:generate-fixture -- --save <name> --start-date YYYY-MM-DD --end-date YYYY-MM-DD --output <path>` |
| Test (verbose)    | `npm run test:python`                                                                       |
| Test (CI)         | `npm run test:ci:python`                                                                    |

Python GraphQL client is generated using ariadne-codegen. Queries are defined in `agent/queries.graphql` and output to `agent/src/agent/graphql_client/`. The generated directory is excluded from ruff and pyright.

### npm Script Guidelines

When adding or modifying npm scripts, require explicit arguments from the user rather than embedding default values in the script.

```diff
- "agent:analyze": "... -- uv run agent analyze --save",  # Bad: --save expects implicit arg
+ "agent:analyze": "... -- uv run agent analyze",         # Good: user provides --save <name>
```

## Code Style

**TypeScript**: Strict typing, no `as` casts, no `!` assertions, arrow functions only, ternaries over if/else, use generated Zod schemas for GraphQL data.

**Python**: Full type annotations, PEP 8 naming, context managers for resources, list comprehensions where readable, prefer Pydantic models over Dicts in function signatures, docstrings for classes and protocols.

**Both**: Comments only where logic isn't self-evident—avoid redundant or excessive commentary. Exact dependency versions, run quality checks after changes.

### Python Agent Pattern

pydantic-ai agents must be lazily initialized to avoid requiring API keys at import time. This allows utility commands like `list-models` and `--help` to work without credentials.

```python
_agent: Agent[Deps, Output] | None = None

def get_agent() -> Agent[Deps, Output]:
    global _agent
    if _agent is None:
        _agent = Agent(...)
        _register_tools(_agent)
    return _agent
```

With lazy initialization, `__init__.py` re-exports are safe since importing the module won't trigger agent creation.

### Quality Checks

After TypeScript changes: `npm run lint:typescript && npm run build && npm run test:ci:typescript`

After Python changes: `npm run typecheck:python && npm run lint:python && npm run format:python && npm run test:ci:python`

After UI changes: `npm run ui:build`

## Git

**ALWAYS invoke the `/commit` skill when committing code.** The skill handles commit format, quality checks, and workflow decisions.

Workflow:
- Use branch-based development, not git worktrees
- Minor fixes can be committed directly to main; larger changes require a feature branch
- If explicitly told to commit to a specific branch, do so without questioning

Safety:
- Never force push, hard reset, or skip hooks unless requested
- Never amend other developers' commits

## GraphQL Schema Changes

When modifying `graphql/schema.graphql`:

1. **BudgetEntry fields**: Update `src/db/budget.ts` (`getBudgetBatchQuery`)
2. **Grafana dashboards**: Dashboards in `grafana/*.json` reference schema fields via selectors like `budget.balance.armies.energy`. Changes break silently. Use `grep -l "fieldName" grafana/*.json` to find affected files, then update selectors, column definitions, and embedded GraphQL queries.
3. **Python client**: If Budget types change, update `agent/queries.graphql` and run `npm run graphql:codegen:python`
4. **Sandbox agent prompts**: If `BudgetEntry` or `BudgetCategory` fields change, update `RESOURCE_FIELDS` and `BUDGET_CATEGORIES` in `agent/src/agent/sandbox_budget_agent/prompts.py`

Column name mapping: `snake_case` (DB) → `camelCase` (GraphQL) via `selectRows()`

## Documentation Maintenance

Keep synchronized when changing:

- Commands → Update Commands section
- System internals → Update relevant `docs/*.md` file
- Grafana → Update `grafana/README.md`

## Claude-Specific

- Use Context7 for library documentation without being asked
- Prefer async versions of libraries

## MCP Python Executor

The `run_python_code` tool runs Python in a sandboxed environment:

- **No filesystem access**: Cannot read or write files
- **Available libraries**: `requests`, `httpx` (plus Python 3.14 standard library)
- **Use case**: Quick calculations, data transformations, API calls within the sandbox
