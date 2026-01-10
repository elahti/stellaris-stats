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

| File | Purpose | Database Service |
|------|---------|------------------|
| `.env.stellaris-stats.tests` | TypeScript tests | `db-tests` |
| `.env.stellaris-stats.evals` | Python evals | `db-evals` |

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

### Test Files

| File | Purpose |
|------|---------|
| `test_tools.py` | Pure function tests: `select_latest_dates()`, `get_gamestates_for_dates()` |
| `test_agent_functions.py` | Agent logic: `sum_resources_for_snapshot()`, prompt builders |
| `test_models.py` | Pydantic model validation |
| `test_mock_client.py` | MockClient and fixture loading tests |
| `test_evaluators.py` | NoResourceDrop/ResourceDrop evaluator logic |
| `test_tools_async.py` | Async functions: `get_available_dates()`, `list_saves()` |

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
