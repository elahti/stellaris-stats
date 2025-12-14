# CLAUDE.md

This file provides instructions to Claude Code when working with code in this repository.

## Project Overview

This project provides a GraphQL API for analyzing Stellaris game statistics. It parses Stellaris save files (Paradox Interactive's Clausewitz engine format), stores game state data in PostgreSQL, and exposes it through a GraphQL API with Redis-based caching for optimal performance.

## Project Directory Structure

The repository is organized into the following main directories:

- `src/` - TypeScript source code
  - `db/` - Database connection and utilities
  - `graphql/` - GraphQL server implementation and generated types
  - `parser/` - Game state parsing logic
  - `scripts/` - Utility scripts
- `agent/` - Python source code and project files
  - `src/` - Python source code
- `migrations/` - Database migration files
- `graphql/` - GraphQL schema definitions
- `grafana/` - Grafana dashboard configurations
- `tests/` - Test files and utilities
  - `utils/` - Test utilities (database, server, fixtures)
  - `fixtures/` - SQL fixture files for test data
- `dist/` - Compiled TypeScript output
- `.devcontainer/` - Development container configuration
- `db-dump-data/` - Database dump files
- `gamestate-json-data/` - Game state data files

## Development Commands

All commands are run from the repository root (`/workspace`).

### TypeScript Commands

Build TypeScript code (includes GraphQL code generation):

```bash
npm run build
```

Generate only GraphQL resolver types, TypeScript types and Zod schemas (without full build):

```bash
npm run graphql:codegen
```

Run linting:

```bash
npm run lint
```

### Python Commands

All Python commands use `cd agent &&` prefix.

Sync dependencies and update lock file:

```bash
cd agent && uv sync
```

Run type checking:

```bash
cd agent && uv run pyright
```

Run linting:

```bash
cd agent && uv run ruff check
```

Run formatting:

```bash
cd agent && uv run ruff format
```

### Testing Commands

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

## Development Guidelines

Use these guidelines and rules whenever you're making changes to the codebase.

### Documentation Maintenance

This CLAUDE.md file serves as the central source of truth for development practices, architecture, and conventions. Keep it synchronized with the codebase:

- When adding or modifying development commands, update the "Development Commands" section
- When adding, updating, or removing dependencies, update the "Libraries Reference" section with exact versions
- When establishing new architectural patterns or changing existing ones, update the "Architecture & Technical Details" section
- When changing code style conventions or quality check processes, update the relevant guidelines section
- When modifying the GraphQL schema, update documentation about schema structure and any affected Grafana dashboards
- When creating or updating Grafana dashboards, update the "GraphQL & Grafana" section
- When changing Git workflows or commit conventions, update the "Git & Commits" section
- When adding new configuration files or changing build processes, document them appropriately

The goal is to ensure that CLAUDE.md always accurately reflects the current state of the project, making it a reliable reference for development work.

### Code Editing Principles

- When editing code or other files, don't add comments.
- When creating or updating code, do only edits that the user has asked you to do.
- Ignore all errors that existed before you started editing code.
- Do not add any extraneous features that the user hasn't asked you to do. Instead, you are allowed to ask the user if you should add such features.
- Do not perform any extraneous fixes to the code that are unrelated to the task that you're completing.

### Git & Commits

#### When to Commit

- Only create commits when explicitly requested by the user.
- If unclear whether to commit, ask the user first.

#### Before Committing

Before creating a commit, always:

1. Run `git status` to see all untracked and modified files
2. Run `git diff` to review unstaged changes
3. Run `git diff --cached` to review staged changes (if any)
4. Run `git log --oneline -5` to check recent commit message style

#### Commit Message Style

- Prefer concise, one-liner commit messages when possible
- Use imperative mood (e.g., "Add feature" not "Added feature")
- Keep the first line under 72 characters
- For multi-line messages:
  - First line is the summary
  - Blank line
  - Additional context as bullet points if needed
- **Do not add any "authored by", "co-authored-by", or attribution lines**
- **Do not add emoji or "generated with" signatures**

#### Commit Safety

- Never run destructive/irreversible git commands (force push, hard reset) unless explicitly requested
- Never skip hooks (--no-verify, --no-gpg-sign) unless explicitly requested
- Never amend commits from other developers - always check authorship first with `git log -1 --format='%an %ae'`
- Never force push to main/master branches
- Pre-commit hooks (husky, lint-staged) will run automatically - this is expected behavior

#### Example Commit Workflow

```bash
# Review changes
git status
git diff

# Stage relevant files
git add file1.ts file2.ts

# Create commit with clean message
git commit -m "Add budget migration TypeScript conversion"

# Verify commit
git status
```

### TypeScript Guidelines

#### Code Style

- Use strict typing and strict null checks.
- Never use type casting ("as" keyword).
- Never use non-null assertions ("!" keyword).
- Always use arrow function syntax instead of function keywords.
- Prefer ternary operators over if/else statements.
- Always use generated Zod schemas and TypeScript types from GraphQL code generation when working with GraphQL data structures.

#### Dependencies

- TypeScript dependencies are managed in `/workspace/package.json`.
- Always use exact versioning and latest possible versions.

#### Quality Checks

After making TypeScript changes:

- Use both `mcp__ide__getDiagnostics` and `npm run lint` tools to check for linting and formatting errors.
- Run `npm run build` to verify no compile errors with up-to-date generated GraphQL files.

### Python Guidelines

#### Code Style

- Use strict typing with full type annotations for all functions, variables, and class attributes.
- Prefer list comprehensions and generator expressions over map/filter when readability is maintained.
- Use context managers (with statements) for resource management.
- Follow PEP 8 naming conventions: snake_case for functions and variables, PascalCase for classes.

#### Environment & Configuration

- Python virtual environment managed with uv.
- Dependencies defined in `/workspace/agent/pyproject.toml`.
- Use `uv sync` command to update `/workspace/agent/uv.lock`.
- Ruff is configured for linting and formatting (configuration file location: `/workspace/agent/pyproject.toml`).
- Pyright is configured with strict type-checked rules (configuration file location: `/workspace/agent/pyproject.toml`).

#### Dependencies

- When adding dependencies to pyproject.toml, always use exact version, without caret (^) or other version specifiers.
- Always use latest versions of dependencies where possible.

#### Quality Checks

After making Python changes:

- Use `mcp__ide__getDiagnostics` tool to check for linting and formatting errors.
- Run the type checking, linting, and formatting commands listed in the Development Commands section.

### GraphQL & Grafana

#### Schema and Database Query Synchronization

When modifying the GraphQL schema at `graphql/schema.graphql`, you MUST update corresponding database queries to maintain consistency:

**BudgetEntry Schema Changes:**

If you add, remove, or rename fields in the `BudgetEntry` type, you MUST update `src/db/budget.ts`:

1. **Update `emptyBudgetEntry()` function** - Add/remove/rename fields with default value of `0`
2. **Update `getBudgetBatchQuery` SQL** - Add/remove/rename corresponding database columns (using snake_case)
   - The query automatically converts snake_case column names to camelCase via `selectRows()`
   - Example mappings: `astral_threads` → `astralThreads`, `exotic_gases` → `exoticGases`

**Important Notes:**
- Database column names use snake_case (e.g., `be.astral_threads`)
- GraphQL schema fields use camelCase (e.g., `astralThreads`)
- The `selectRows()` function in `src/db.ts` automatically converts snake_case to camelCase
- The `BudgetCategoryRow` schema extends `BudgetEntrySchema()`, which is auto-generated from GraphQL schema

#### Schema and Dashboard Synchronization

When modifying the GraphQL schema at `graphql/schema.graphql`, check if Grafana dashboards need corresponding updates:

- Grafana dashboards are located in the `grafana/` directory
- Dashboard JSON files contain hardcoded column definitions and GraphQL queries that mirror the schema structure
- If you add, remove, or rename fields in the GraphQL schema's `BudgetCategory` or `BudgetEntry` types, the affected dashboards must be updated to maintain consistency
- Each dashboard panel typically has:
  - Column definitions (`columns` array) specifying which fields to display
  - GraphQL query (`body_graphql_query`) that fetches the data
- Both the column definitions and GraphQL queries must be kept in sync with the schema
- After schema changes, review all dashboard files to identify which ones query the modified types

#### Visualization Guidelines

When creating new Grafana visualizations, follow these patterns established in existing dashboards:

**Panel Configuration:**
- Use `yesoreyeram-infinity-datasource` as the data source
- Set panel type to `timeseries` for time-based data
- Enable `liveNow: true` for real-time updates
- Configure legend to show `last`, `max`, and `mean` values

**Column Definitions:**
- Define columns with JSON selectors matching the GraphQL response structure
- Example: `selector: "budget.balance.armies.energy"`
- Always include a `date` column as the first column for time series data

**GraphQL Query Structure:**
- Use `root_selector` to specify the data path (e.g., `data.save.gamestates`)
- Include the `$saveFilename` variable in queries to support dashboard template variables
- Structure the query to match the column selectors exactly

**Data Transformations (Applied in Order):**
1. **Convert Date Field**: Use `convertFieldType` transformation to convert the date field to time type
2. **Calculate Aggregates**: Use `calculateField` with `mode: "reduceRow"` and `reducer: "sum"` to create aggregate metrics
3. **Organize Fields**: Use `organize` transformation with `excludeByName` to hide individual detail columns and show only aggregates

**Color Coding (Resource Colors by Panel):**

The Empire Budget dashboard (`grafana/empireBudget.json`) uses the following color scheme for resources:

**Basic Resources:**
- Energy: `#F2CC0C` (Yellow)
- Minerals: `#E02F44` (Red)
- Food: `#73BF69` (Green)
- Trade: `#8AB8FF` (Blue)

**Advanced Resources:**
- Alloys: `#FF69B4` (Hot Pink)
- Consumer Goods: `#8B4513` (Saddle Brown)

**Strategic Resources:**
- Exotic Gases: `#73BF69` (Green)
- Rare Crystals: `#F2CC0C` (Yellow)
- Volatile Motes: `#8B4513` (Saddle Brown)

**Rare Resources:**
- Zro: `#5DADE2` (Light Blue)
- Dark Matter: `#9B59B6` (Purple)
- Living Metal: `#616161` (Gray)
- Nanites: `#BDBDBD` (Light Gray)

**Abstract Resources:**
- Influence: `#A64D79` (Purple)
- Unity: `#56B4E9` (Turquoise)
- Physics Research: `#3274A1` (Blue)
- Engineering Research: `#F2CC0C` (Yellow)
- Society Research: `#73BF69` (Green)

Apply colors using field overrides with `matcher.id: "byName"` and `properties.id: "color"` with `mode: "fixed"`.

**Template Variables:**
- Include a `saveFilename` variable that queries available save files
- Configure variable with `refresh: 1` for automatic updates
- Use GraphQL query to populate variable options from the `saves` query

### Claude-Specific Tools

- Always use context7 when I need code generation, setup or configuration steps, or library/API documentation. This means you should automatically use the Context7 MCP tools to resolve library id and get library docs without me having to explicitly ask.
- When having the option of using async and sync version of a library, prefer async version.

## Architecture & Technical Details

### GraphQL Caching System

The project implements a three-tier caching strategy using Redis to optimize GraphQL query performance for immutable game state data.

**TL;DR**: Three-tier caching (Response → Field → DataLoader) using Redis for immutable game state.

#### Caching Architecture

##### Tier 1: Response-Level Caching
- **Implementation**: Custom Apollo Server plugin (`src/graphql/responseCache.ts`)
- **Class**: `RedisCache` implementing Apollo's `KeyValueCache` interface
- **Key Prefix**: `graphql:` for all cache entries
- **Key Format**: `graphql:{query-hash}:{variables-hash}` (auto-generated by Apollo)
- **Null Prevention**: Responses containing null values are NOT cached to prevent caching errors

##### Tier 2: Field-Level Caching
- **Implementation**: Manual caching in resolvers (`src/graphql/generated/Gamestate.ts`)
- **Cached Fields**:
  - `Gamestate.budget` - Key: `budget:gamestateId:{id}`
  - `Gamestate.planets` - Key: `planets:gamestateId:{id}`
- **Strategy**: Check cache first, on miss load via DataLoader and cache result
- **TTL**: No expiration (immutable data)

##### Tier 3: DataLoader Batching with Request-Scoped Cache
- **Location**: `src/graphql/dataloaders/`
- **DataLoaders**:
  - `budgetLoader`: Batches budget queries by gamestateId
  - `planetsLoader`: Batches planet queries by gamestateId
  - `gamestatesLoader`: Batches gamestate queries by saveId
- **Purpose**: Prevent N+1 query problems and provide request-level deduplication
- **Lifecycle**: Created per GraphQL request (request-scoped)
- **Database Functions**: Calls batch query functions like `getBudgetBatch()`, `getPlanetsBatch()`

#### Redis Configuration

- **Client**: `ioredis` library (v5.8.2) configured in `src/redis.ts`
- **Environment Variables**:
  - `STELLARIS_STATS_REDIS_HOST` (default: 'redis')
  - `STELLARIS_STATS_REDIS_PORT` (default: 6379)
  - `STELLARIS_STATS_REDIS_DB` (default: 0)
- **Retry Strategy**: Exponential backoff (50ms * attempts, max 2000ms, 3 max retries)
- **Deployment**: Redis 7.4-alpine container with persistent volume storage, internal network only (no exposed ports)

#### Cache Control Directives

- **GraphQL Schema**: Uses `@cacheControl` directive in `graphql/schema.graphql`
- **Cached Types**: `Budget` and `Gamestate` types marked with `@cacheControl` (no maxAge specified)
- **Default Behavior**: No caching unless explicit `@cacheControl` directive present
- **TTL Strategy**: No expiration for immutable types (game state data never changes once stored)

#### Cache Invalidation

- **Current Implementation**: None
- **Rationale**: Game state data is immutable - once parsed and stored, it never changes
- **Considerations**: Redis memory may grow over time; consider implementing eviction policy (e.g., `allkeys-lru`) if needed

#### Query Flow

```
GraphQL Query
  → Apollo Response Cache (check)
    → Resolver Field-Level Cache (check)
      → DataLoader Request Cache (check)
        → Batch Database Query
          → Store in all cache layers
            → Return result
```

### Testing Framework

The project uses end-to-end integration testing with complete database isolation, allowing tests to run in parallel without interference.

**TL;DR**: Database-per-test isolation using Bun test runner. Each test gets its own PostgreSQL database with migrations.

#### Testing Architecture

##### Test Runner
- **Framework**: Bun (built-in test runner)
- **Test Files**: `tests/**/*.test.ts`
- **Command**: `npm test` (uses `dotenvx` to load test environment)
- **Execution**: Parallel by default, each test fully isolated

##### Database Isolation Strategy
- **Pattern**: Database-per-test
- **Implementation**: Each test creates a unique PostgreSQL database using `crypto.randomUUID()`
- **Database Naming**: `stellaris_test_{uuid}` with hyphens replaced by underscores
- **Lifecycle**: Created in `beforeEach`, destroyed in `afterEach`
- **Migrations**: Automatically run on each test database using `node-pg-migrate`
- **Test Database Service**: Separate `db-test` PostgreSQL container in docker-compose

##### Test Infrastructure Components

###### 1. Test Database Manager (`tests/utils/testDatabase.ts`)

Creates and destroys isolated test databases:

```typescript
const testDb = await createTestDatabase()
// Returns: { pool: Pool, dbName: string, dbConfig: PoolConfig }

await destroyTestDatabase(testDb)
```

**Features:**
- Creates unique database with UUID-based name
- Runs all migrations automatically
- Provides dedicated connection pool
- Cleanup ensures no test database leaks

###### 2. Test Server Factory (`tests/utils/testServer.ts`)

Creates Apollo Server configured for testing:

```typescript
const testServer = createTestServer(testDb)
// Returns: { server, pool, cache, mockRedis, cleanup }
```

**Configuration:**
- Uses test database pool
- Mock Redis implementation (in-memory)
- All production plugins (response cache, cache control)
- Client release plugin (auto-releases connections)
- No HTTP layer (uses `executeOperation` directly)

###### 3. GraphQL Client Wrapper (`tests/utils/graphqlClient.ts`)

Type-safe GraphQL query execution:

```typescript
const result = await executeQuerySimple<{
  saves: { filename: string }[]
}>(testServer, query, variables)
// Returns: { data?: T, errors?: GraphQLFormattedError[] }
```

**Features:**
- Creates proper GraphQL context per request
- Includes DataLoaders and cache
- Type-safe response with generics
- Automatic client release via server plugin

###### 4. Fixture Loader (`tests/utils/fixtures.ts`)

Loads SQL fixtures into test database:

```typescript
await loadFixture(testDb.pool, 'saves/basic-save.sql')
await loadFixtures(testDb.pool, ['saves/save1.sql', 'saves/save2.sql'])
```

**Fixture Pattern:**
- Located in `tests/fixtures/`
- Use subqueries for foreign key references
- Sequential execution to maintain FK dependencies
- Example: `(SELECT save_id FROM save WHERE filename = 'test.sav')`

###### 5. Mock Redis (`tests/utils/mockRedis.ts`)

In-memory Redis implementation:

- Implements same interface as `ioredis`
- Compatible with `RedisCache` wrapper
- No external dependencies
- Automatically cleared on cleanup

#### Test Configuration

**Environment File**: `.devcontainer/.env.db.test`

```bash
STELLARIS_TEST_DB_HOST=db-test
STELLARIS_TEST_DB_PORT=5432
STELLARIS_TEST_DB_USER=stellaris_test
STELLARIS_TEST_DB_PASSWORD=stellaris_test
STELLARIS_TEST_DB_ADMIN_DATABASE=stellaris_test_admin
```

**Docker Compose**: Separate test database service

```yaml
db-test:
  image: postgres:18
  container_name: stellaris-stats_db-test
  env_file:
    - .env.db.test
  networks:
    - stellaris-stats-db-test-network
  volumes:
    - db-test-data:/var/lib/postgresql
```

#### Writing Tests

**Complete Test Example:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { createTestDatabase, destroyTestDatabase } from './utils/testDatabase.js'
import { createTestServer } from './utils/testServer.js'
import { executeQuerySimple } from './utils/graphqlClient.js'
import { loadFixture } from './utils/fixtures.js'
import type { TestDatabaseContext } from './utils/testDatabase.js'
import type { TestServerContext } from './utils/testServer.js'

describe('Feature Name', () => {
  let testDb: TestDatabaseContext
  let testServer: TestServerContext

  beforeEach(async () => {
    // Create isolated database and load test data
    testDb = await createTestDatabase()
    await loadFixture(testDb.pool, 'feature/test-data.sql')

    // Create Apollo Server with test database
    testServer = createTestServer(testDb)
  })

  afterEach(async () => {
    // Clean up server and database
    await testServer.cleanup()
    await destroyTestDatabase(testDb)
  })

  it('performs expected behavior', async () => {
    // Execute GraphQL query with type safety
    const result = await executeQuerySimple<{
      field: { subfield: string }
    }>(
      testServer,
      `query { field { subfield } }`
    )

    // Assert results
    expect(result.errors).toBeUndefined()
    expect(result.data?.field.subfield).toBe('expected value')
  })
})
```

**Fixture File Example** (`tests/fixtures/feature/test-data.sql`):

```sql
-- Insert parent record
INSERT INTO save (filename, name)
VALUES ('test.sav', 'Test Empire');

-- Insert child record with FK reference using subquery
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'test.sav'),
  '2250-01-01',
  '{}'::jsonb
);
```

#### Testing Best Practices

**Database Setup:**
- Always create fresh database in `beforeEach`
- Always destroy database in `afterEach`
- Load fixtures after creating database
- Use descriptive fixture file names reflecting test scenarios

**GraphQL Queries:**
- Use TypeScript generics for type-safe responses
- Always check `result.errors` is undefined
- Use optional chaining for data access (`result.data?.field`)
- Request only the fields needed for assertions

**Fixtures:**
- Keep fixtures focused on specific test scenarios
- Use subqueries for FK references (no hardcoded IDs)
- Organize fixtures by feature/domain
- Document complex data setups with SQL comments

**Test Organization:**
- Group related tests in `describe` blocks
- Use descriptive test names following pattern: "returns/performs/validates X when Y"
- One logical assertion per test when possible
- Share setup via `beforeEach`, not between tests

**Performance:**
- Tests run in parallel by default (database-per-test enables this)
- Each test takes ~200-400ms including database setup
- Avoid unnecessary data in fixtures
- Consider `--watch` mode for development

#### Key Implementation Details

**Context Creation Pattern:**
```typescript
const client = await pool.connect()
const contextValue: GraphQLServerContext = {
  client,
  loaders: createDataLoaders(client),
  cache
}
```

**Client Lifecycle:**
- Client acquired from pool per GraphQL request
- Released automatically by server's `willSendResponse` plugin
- No manual `client.release()` needed in tests
- Tests must `await executeQuery` to ensure cleanup

**Server vs Production:**
- Test server has same plugins as production
- Uses `executeOperation()` instead of HTTP
- No `startStandaloneServer()` call
- Context created per operation, not pre-configured

**Database Naming Constraints:**
- PostgreSQL identifiers use underscores not hyphens
- UUID hyphens replaced: `randomUUID().replace(/-/g, '_')`
- Format: `stellaris_test_550e8400_e29b_41d4_a716_446655440000`

## Libraries Reference

### TypeScript/Node.js Libraries

#### Core Dependencies

- **@apollo/server** (5.2.0) - GraphQL server implementation
- **graphql** (16.12.0) - GraphQL implementation for JavaScript
- **graphql-scalars** (1.25.0) - Additional GraphQL scalar types
- **pg** (8.16.3) - PostgreSQL client for Node.js
- **ioredis** (5.8.2) - Redis client for Node.js with cluster and sentinel support
- **zod** (4.1.13) - TypeScript-first schema validation with static type inference
- **jomini** (0.9.1) - Parser for Paradox Interactive game files (Clausewitz engine format)
- **yauzl-promise** (4.0.0) - Promise-based ZIP file extraction
- **pino** (10.1.0) - Fast JSON logger
- **commander** (14.0.2) - Command-line interface builder
- **node-pg-migrate** (8.0.3) - PostgreSQL database migration tool

#### Development Dependencies

- **@graphql-codegen/cli** (6.1.0) - GraphQL code generation CLI
- **@eddeee888/gcg-typescript-resolver-files** (0.14.1) - GraphQL code generator plugin for TypeScript resolver files
- **graphql-codegen-typescript-validation-schema** (0.18.1) - Generates Zod validation schemas from GraphQL schema
- **typescript** (5.9.3) - TypeScript compiler
- **tsx** (4.21.0) - TypeScript execute - runs TypeScript files directly
- **eslint** (9.39.1) - JavaScript/TypeScript linter
- **prettier** (3.7.4) - Code formatter
- **husky** (9.1.7) - Git hooks management
- **lint-staged** (16.2.7) - Run linters on staged git files
- **@types/bun** (1.3.4) - TypeScript definitions for Bun
- **bun** (installed globally in dev container) - Fast JavaScript runtime and test runner

### Python Libraries

#### Development Dependencies

- **pyright** (1.1.407) - Static type checker for Python
- **ruff** (0.14.8) - Fast Python linter and code formatter
