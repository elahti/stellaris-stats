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
agent/src/agent/        # Python budget analysis agent
migrations/             # Database migrations
graphql/                # GraphQL schema definitions
grafana/                # Dashboard configurations (see grafana/README.md)
tests/                  # Test files, utils, fixtures
docs/                   # Detailed documentation
  ARCHITECTURE.md       # Caching, testing, parser details
  LIBRARIES.md          # Dependency versions
```

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

### Python

| Task              | Command                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------- |
| Sync deps         | `cd agent && uv sync`                                                                       |
| GraphQL codegen   | `npm run graphql:codegen:python`                                                            |
| Type check        | `npm run typecheck:python`                                                                  |
| Lint              | `npm run lint:python`                                                                       |
| Format            | `npm run format:python`                                                                     |
| List saves        | `npm run agent:list-saves`                                                                  |
| Analyze budget    | `npm run agent:analyze -- <filename>`                                                       |
| Run evals         | `npm run agent:evals -- --dataset stable_budget_balance`                                     |
| Generate fixture  | `npm run agent:generate-fixture -- --save <name> --start-date YYYY-MM-DD --end-date YYYY-MM-DD --output <path>` |

Python GraphQL client is generated using ariadne-codegen. Queries are defined in `agent/queries.graphql` and output to `agent/src/agent/graphql_client/`. The generated directory is excluded from ruff and pyright.

## Code Style

**TypeScript**: Strict typing, no `as` casts, no `!` assertions, arrow functions only, ternaries over if/else, use generated Zod schemas for GraphQL data.

**Python**: Full type annotations, PEP 8 naming, context managers for resources, list comprehensions where readable, prefer Pydantic models over Dicts in function signatures, docstrings for classes and protocols.

**Both**: No comments in code, exact dependency versions, run quality checks after changes.

### Quality Checks

After TypeScript changes: `npm run lint:typescript && npm run build && npm run test:ci:typescript`

After Python changes: `npm run typecheck:python && npm run lint:python && npm run format:python`

### Safety

- Never force push, hard reset, or skip hooks unless requested
- Never amend other developers' commits
- Pre-commit hooks run automatically (expected)

## GraphQL Schema Changes

When modifying `graphql/schema.graphql`:

1. **BudgetEntry fields**: Update `src/db/budget.ts` (`getBudgetBatchQuery`)
2. **Grafana dashboards**: Update affected JSON files in `grafana/` (column definitions + queries)
3. **Python client**: If Budget types change, update `agent/queries.graphql` and run `npm run graphql:codegen:python`

Column name mapping: `snake_case` (DB) → `camelCase` (GraphQL) via `selectRows()`

## Documentation Maintenance

Keep synchronized when changing:

- Commands → Update Commands section
- Dependencies → Update `docs/LIBRARIES.md`
- Architecture → Update `docs/ARCHITECTURE.md`
- Grafana → Update `grafana/README.md`

## Architecture Summary

**Caching**: Three-tier (Response → Field → DataLoader) using Redis. No TTL for immutable game data. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#graphql-caching-system).

**Testing**: Database-per-test isolation with Bun runner. Use `test-writer` agent for new tests. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#testing-framework).

**Parser**: Interval-based ZIP extraction → Jomini parsing → PostgreSQL JSONB. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#parser-system).

**Budget Agent**: pydantic-ai agent comparing budget snapshots ~1 year apart. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#budget-analysis-agent).

## Claude-Specific

- Use Context7 for library documentation without being asked
- Prefer async versions of libraries
