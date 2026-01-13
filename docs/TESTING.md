# Testing Framework

The project uses end-to-end integration testing with complete database isolation, allowing tests to run in parallel without interference.

## TypeScript Testing

### Test Runner

- **Framework**: Bun (built-in test runner)
- **Test Files**: `tests/**/*.test.ts`
- **Command**: `npm run test:typescript` (uses `dotenvx` to load test environment)
- **Execution**: Parallel by default, each test fully isolated

### Database Isolation Strategy

- **Pattern**: Database-per-test
- **Implementation**: Each test creates a unique PostgreSQL database using `crypto.randomUUID()`
- **Database Naming**: `stellaris_test_{uuid}` with hyphens replaced by underscores
- **Lifecycle**: Created in `beforeEach`, destroyed in `afterEach`
- **Migrations**: Automatically run on each test database using `node-pg-migrate`
- **Database Services**: Separate PostgreSQL containers in docker-compose: `db-tests` for TypeScript tests, `db-evals` for Python evals

### Test Infrastructure Components

#### 1. Test Database Manager (`tests/utils/testDatabase.ts`)

Creates and destroys isolated test databases using a template database pattern for performance:

```typescript
const testDb = await createTestDatabase()
// Returns: { pool: Pool, dbName: string, dbConfig: PoolConfig }

await destroyTestDatabase(testDb)
```

**Features:**

- Creates unique database with UUID-based name
- **Template optimization**: First test creates `stellaris_test_template` with migrations, subsequent tests clone from it
- Provides dedicated connection pool
- Cleanup ensures no test database leaks
- Template destroyed at end of test run via `destroyTestTemplate()`

#### 2. Test Server Factory (`tests/utils/testServer.ts`)

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

#### 3. GraphQL Client Wrapper (`tests/utils/graphqlClient.ts`)

Type-safe GraphQL query execution:

```typescript
const result = await executeQuery<{
  saves: { filename: string }[]
}>(testServer, query, variables)
// Returns: { data?: T, errors?: GraphQLFormattedError[] }
```

**Features:**

- Creates proper GraphQL context per request
- Includes DataLoaders and cache
- Type-safe response with generics
- Automatic client release via server plugin

#### 4. Fixture Loader (`tests/utils/fixtures.ts`)

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

#### 5. Mock Redis (`tests/utils/mockRedis.ts`)

In-memory Redis implementation:

- Implements same interface as `ioredis`
- Compatible with `RedisCache` wrapper
- No external dependencies
- Automatically cleared on cleanup

### Test Configuration

**Environment Files**: Separate env files for tests and evals

| File                         | Purpose          | Database Service |
| ---------------------------- | ---------------- | ---------------- |
| `.env.stellaris-stats.tests` | TypeScript tests | `db-tests`       |
| `.env.stellaris-stats.evals` | Python evals     | `db-evals`       |

**TypeScript Tests** (`.env.stellaris-stats.tests`):

```bash
STELLARIS_STATS_DB_HOST=db-tests
STELLARIS_STATS_DB_PORT=5432
STELLARIS_STATS_DB_NAME=stellaris_tests
STELLARIS_STATS_DB_USER=stellaris_tests
STELLARIS_STATS_DB_PASSWORD=stellaris_tests_password
```

**Python Evals** (`.env.stellaris-stats.evals`):

```bash
STELLARIS_STATS_DB_HOST=db-evals
STELLARIS_STATS_DB_PORT=5432
STELLARIS_STATS_DB_NAME=stellaris_evals
STELLARIS_STATS_DB_USER=stellaris_evals
STELLARIS_STATS_DB_PASSWORD=stellaris_evals_password
```

**Docker Compose**: Separate database services with inline credentials (no persistent volumes - test databases are ephemeral)

```yaml
db-tests:
  image: postgres:18
  container_name: stellaris-stats_db-tests
  environment:
    POSTGRES_DB: stellaris_tests
    POSTGRES_USER: stellaris_tests
    POSTGRES_PASSWORD: stellaris_tests_password
  networks:
    - stellaris-stats-db-tests-network

db-evals:
  image: postgres:18
  container_name: stellaris-stats_db-evals
  environment:
    POSTGRES_DB: stellaris_evals
    POSTGRES_USER: stellaris_evals
    POSTGRES_PASSWORD: stellaris_evals_password
  networks:
    - stellaris-stats-db-evals-network
```

### Key Implementation Details

**Context Creation Pattern:**

```typescript
const client = await pool.connect()
const contextValue: GraphQLServerContext = {
  client,
  loaders: createDataLoaders(client),
  cache,
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

## Python Testing

The Python agent includes pytest-based unit tests for testing business logic without requiring API keys or network access.

### Test Structure

- **Location**: `agent/tests/`
- **Framework**: pytest with pytest-asyncio for async support
- **Command**: `npm run test:python` (verbose) or `npm run test:ci:python` (CI mode)

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

### Configuration

**pytest.ini_options in `agent/pyproject.toml`:**

```toml
[tool.pytest.ini_options]
asyncio_default_fixture_loop_scope = "function"
asyncio_mode = "auto"
filterwarnings = ["error", "ignore::DeprecationWarning"]
testpaths = ["tests"]
```

### Shared Fixtures (`agent/tests/conftest.py`)

- `empty_mock_client`: Empty MockClient instance
- `sample_fixture_path`: Path to stable_energy_balance.json
- `sample_fixture`: Loaded Fixture from JSON
- `mock_client_from_fixture`: MockClient populated with fixture data
- `agent_deps`: AgentDeps with mock client

### Mocking Strategy

Uses existing mock infrastructure from evals:

- `MockClient`: Dataclass-based mock implementing `GraphQLClientProtocol`
- `load_fixture()`: Loads JSON fixtures with GraphQL response data
- `create_mock_client()`: Creates MockClient from loaded fixture

This approach allows testing agent tools and logic without network calls or API keys.

## Python Evals

The eval system uses real databases for integration testing of agent behavior. It employs the same template database pattern as TypeScript tests for performance.

### Template Database Pattern

Evals use a template database optimization to avoid running migrations for each test case:

```python
# Template created lazily on first create_test_database() call
# Subsequent calls clone from template (fast PostgreSQL operation)

async with eval_environment(fixture_path, settings) as (db_ctx, server):
    # db_ctx.pool - asyncpg connection pool
    # db_ctx.db_name - unique database name
    # db_ctx.settings - connection settings
    result = await run_eval(...)
```

**How it works:**

1. First `create_test_database()` call creates `stellaris_test_template` and runs migrations
2. Subsequent calls use `CREATE DATABASE {name} TEMPLATE stellaris_test_template` (fast clone)
3. Each test database is destroyed after the eval case completes
4. Template is destroyed at end of eval session via `eval_session()` context manager

### Eval Infrastructure (`agent/src/agent/evals/`)

| File                | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `test_database.py`  | Template database creation, cloning, and cleanup |
| `fixture_loader.py` | Loads SQL fixtures into test database            |
| `server_manager.py` | Starts/stops GraphQL server for evals            |
| `cli.py`            | Eval CLI with `eval_session()` context manager   |
| `*_runner.py`       | Dataset-specific eval runners                    |

### Running Evals

```bash
# List available datasets
npm run agent:evals -- --list-datasets

# Run specific dataset
npm run agent:evals -- --dataset sandbox

# Run with specific model
npm run agent:evals -- --dataset sandbox --model anthropic:claude-sonnet-4-20250514

# Run single case
npm run agent:evals -- --dataset sandbox --case "energy_drop"
```

### Session Lifecycle

```python
# In cli.py - ensures template cleanup
@asynccontextmanager
async def eval_session(settings: Settings) -> AsyncIterator[None]:
    try:
        yield
    finally:
        await destroy_test_template(settings)

# Usage in main()
async with eval_session(settings):
    await run_evals(...)  # Template created on first DB, cleaned up after
```

### Performance

- **Before template pattern**: Each eval case ran migrations (~2-5 seconds per case)
- **After template pattern**: First case creates template, subsequent cases clone (~100ms per case)
- For a dataset with 10 cases: ~30 seconds → ~5 seconds for database setup
