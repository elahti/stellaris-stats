# Python Evals with Real GraphQL Server - Architecture Design

## Overview

Replace the mock GraphQL server in Python evals with a real Apollo GraphQL server and PostgreSQL database, following the same isolation patterns used in TypeScript tests.

## Problem Statement

The current Python eval infrastructure uses a mock GraphQL server (`mock_graphql_server.py`) that:

1. Uses raw TCP sockets with manual HTTP parsing
2. Routes queries using string pattern matching
3. Returns pre-recorded JSON fixture data

This approach has issues:

- The mock server doesn't fully replicate real GraphQL behavior
- MCP tool calls from the Python sandbox fail to connect to the mock server
- No testing of actual database queries or resolvers

## Proposed Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Per-Eval Case Lifecycle                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Create Test Database                                                    │
│     └─ Python asyncpg → PostgreSQL (db-test container)                      │
│        └─ Creates: stellaris_test_{uuid}                                    │
│                                                                             │
│  2. Run Migrations                                                          │
│     └─ Python → subprocess → node-pg-migrate                                │
│                                                                             │
│  3. Load SQL Fixtures                                                       │
│     └─ Python asyncpg → Execute SQL from fixture files                      │
│                                                                             │
│  4. Start GraphQL Server                                                    │
│     └─ Python → subprocess → TypeScript test server                         │
│        └─ Listens on random port, outputs URL                               │
│        └─ Uses mock Redis (in-memory)                                       │
│                                                                             │
│  5. Run Eval                                                                │
│     └─ pydantic-ai agent → MCP sandbox → HTTP → GraphQL server              │
│                                                                             │
│  6. Cleanup                                                                 │
│     └─ Stop GraphQL server subprocess                                       │
│     └─ Terminate DB connections                                             │
│     └─ Drop test database                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components

#### 1. Test Database Manager (Python)

**File**: `agent/src/agent/evals/test_database.py`

Manages PostgreSQL test database lifecycle from Python:

```python
from dataclasses import dataclass
from uuid import uuid4
import asyncpg

@dataclass
class TestDatabaseContext:
    pool: asyncpg.Pool
    db_name: str
    host: str
    port: int
    user: str
    password: str

async def create_test_database() -> TestDatabaseContext:
    """Create isolated test database with migrations."""
    # 1. Generate unique database name
    db_name = f"stellaris_test_{uuid4().hex}"

    # 2. Connect to admin database, create test database
    admin_conn = await asyncpg.connect(...)
    await admin_conn.execute(f"CREATE DATABASE {db_name}")

    # 3. Run migrations via subprocess
    await run_migrations(db_name)

    # 4. Create connection pool for test database
    pool = await asyncpg.create_pool(database=db_name, ...)

    return TestDatabaseContext(pool=pool, db_name=db_name, ...)

async def destroy_test_database(ctx: TestDatabaseContext) -> None:
    """Clean up test database."""
    await ctx.pool.close()
    # Terminate connections and drop database
```

#### 2. Test GraphQL Server Entry Point (TypeScript)

**File**: `src/graphql/testGraphQLServerMain.ts`

New entry point for Python evals that:

- Accepts database config via environment variables
- Uses mock Redis (no external dependency)
- Finds free port and outputs it
- Gracefully shuts down on SIGTERM

```typescript
// Key differences from production server:
// 1. Uses MockRedis instead of real Redis
// 2. Outputs port number on stdout for Python to parse
// 3. Database config from env vars (no default config)
// 4. No migrations (Python runs them first)

const runTestGraphQLServer = async () => {
  const dbConfig = {
    STELLARIS_STATS_DB_HOST: process.env.TEST_DB_HOST,
    STELLARIS_STATS_DB_PORT: parseInt(process.env.TEST_DB_PORT),
    STELLARIS_STATS_DB_NAME: process.env.TEST_DB_NAME,
    STELLARIS_STATS_DB_USER: process.env.TEST_DB_USER,
    STELLARIS_STATS_DB_PASSWORD: process.env.TEST_DB_PASSWORD,
  }

  const mockRedis = createMockRedis()
  const cache = new RedisCache(mockRedis as unknown as Redis)

  // Find free port
  const port = await findFreePort()

  // Start server
  await startStandaloneServer(server, {
    listen: { port },
    context: async () => { ... }
  })

  // Output port for Python to parse
  console.log(`SERVER_READY:${port}`)
}
```

#### 3. Server Process Manager (Python)

**File**: `agent/src/agent/evals/server_manager.py`

Manages GraphQL server subprocess:

```python
from dataclasses import dataclass
import asyncio
import subprocess

@dataclass
class GraphQLServerProcess:
    process: asyncio.subprocess.Process
    url: str
    port: int

async def start_graphql_server(db_ctx: TestDatabaseContext) -> GraphQLServerProcess:
    """Start GraphQL server subprocess with test database config."""
    env = {
        "TEST_DB_HOST": db_ctx.host,
        "TEST_DB_PORT": str(db_ctx.port),
        "TEST_DB_NAME": db_ctx.db_name,
        "TEST_DB_USER": db_ctx.user,
        "TEST_DB_PASSWORD": db_ctx.password,
    }

    process = await asyncio.create_subprocess_exec(
        "npx", "tsx", "src/graphql/testGraphQLServerMain.ts",
        env={**os.environ, **env},
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    # Wait for "SERVER_READY:{port}" output
    port = await wait_for_server_ready(process)

    return GraphQLServerProcess(
        process=process,
        url=f"http://localhost:{port}",
        port=port,
    )

async def stop_graphql_server(server: GraphQLServerProcess) -> None:
    """Stop GraphQL server subprocess."""
    server.process.terminate()
    await server.process.wait()
```

#### 4. SQL Fixtures

**Directory**: `agent/src/agent/evals/fixtures/sql/`

SQL fixtures that populate test databases. Two options:

**Option A: Convert JSON fixtures to SQL**

- Write a converter script that reads existing JSON fixtures
- Generates SQL INSERT statements matching schema

**Option B: Create dedicated SQL fixtures**

- Similar structure to `tests/fixtures/saves/*.sql`
- More explicit control over test data

Example fixture structure:

```sql
-- sudden_drop_detection/trade_drop_only.sql

INSERT INTO save (filename, name)
VALUES ('commonwealthofman_1251622081', 'Commonwealth of Man');

INSERT INTO gamestate (save_id, date, data)
VALUES
  ((SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081'),
   '2308-07-01', '{}'::jsonb),
  -- ... more gamestates

INSERT INTO budget_entry (energy, minerals, trade, ...)
VALUES (...);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES (...);
```

#### 5. SQL Fixture Generator (Python)

**File**: `agent/scripts/generate_sql_fixture.py`

Generates SQL fixtures by reading directly from the production database. Replaces the current `generate_fixture.py` which queries the GraphQL API.

**Parameters** (same as existing script):

- `--save`: Save filename to extract data for
- `--start-date`: Start date for filtering (YYYY-MM-DD)
- `--end-date`: End date for filtering (YYYY-MM-DD)
- `--output`: Output path for the SQL fixture file
- `--description`: Optional description comment

**Database Tables Exported:**

| Table             | Columns                                                                       | Filter                         |
| ----------------- | ----------------------------------------------------------------------------- | ------------------------------ |
| `save`            | `filename`, `name`                                                            | `filename = :save`             |
| `gamestate`       | `gamestate_id`, `date` (data omitted)                                         | `date BETWEEN :start AND :end` |
| `budget_entry`    | All 20 resource columns                                                       | Via `budget_category` join     |
| `budget_category` | `gamestate_id` (FK), `category_type`, `category_name`, `budget_entry_id` (FK) | Via `gamestate` join           |

**Usage:**

```bash
npm run agent:generate-sql-fixture -- \
  --save commonwealthofman_1251622081 \
  --start-date 2308-07-01 \
  --end-date 2311-10-01 \
  --output src/agent/evals/fixtures/sql/sudden_drop_detection/trade_drop_only.sql \
  --description "Trade drop only - 100% trade resource drop"
```

**Key Design Points:**

- Uses `Settings` class for DB config (env vars via `dotenvx run -f .env.stellaris-stats`)
- Uses subqueries for FK references (same pattern as TypeScript fixtures)
- Uses `'{}'::jsonb` for `gamestate.data` (not needed for budget evals)
- Exports all 20 resource columns from `budget_entry`

**Comparison with `generate_fixture.py`:**

| Aspect           | `generate_fixture.py` (JSON)   | `generate_sql_fixture.py` (SQL)          |
| ---------------- | ------------------------------ | ---------------------------------------- |
| Data source      | GraphQL API                    | Production PostgreSQL directly           |
| Output format    | JSON fixture                   | SQL INSERT statements                    |
| Data included    | GraphQL response structure     | Raw table data (save, gamestate, budget) |
| `gamestate.data` | Full JSONB                     | Empty `{}` (not needed for budget evals) |
| Dependencies     | Running GraphQL server         | Direct database connection               |

#### 6. Fixture Loader (Python)

**File**: `agent/src/agent/evals/fixture_loader.py`

```python
from pathlib import Path
import asyncpg

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "sql"

async def load_fixture(pool: asyncpg.Pool, fixture_path: str) -> None:
    """Load SQL fixture into test database."""
    full_path = FIXTURES_DIR / fixture_path
    sql = full_path.read_text()
    await pool.execute(sql)
```

#### 7. Updated Sandbox Runner

**File**: `agent/src/agent/evals/sandbox_runner.py` (modified)

```python
from contextlib import asynccontextmanager
from typing import AsyncIterator

from agent.evals.test_database import (
    TestDatabaseContext,
    create_test_database,
    destroy_test_database,
)
from agent.evals.server_manager import (
    GraphQLServerProcess,
    start_graphql_server,
    stop_graphql_server,
)
from agent.evals.fixture_loader import load_fixture

@asynccontextmanager
async def eval_environment(
    fixture_path: str,
) -> AsyncIterator[tuple[TestDatabaseContext, GraphQLServerProcess]]:
    """Set up complete eval environment with real DB and GraphQL server."""
    db_ctx = await create_test_database()
    try:
        await load_fixture(db_ctx.pool, fixture_path)
        server = await start_graphql_server(db_ctx)
        try:
            yield db_ctx, server
        finally:
            await stop_graphql_server(server)
    finally:
        await destroy_test_database(db_ctx)

async def run_sandbox_budget_eval(
    inputs: SandboxEvalInputs,
    model_name: str | None = None,
    settings: Settings | None = None,
) -> SuddenDropAnalysisResult:
    """Run eval with real GraphQL server."""
    if settings is None:
        settings = Settings()

    async with eval_environment(inputs["fixture_path"]) as (db_ctx, server):
        # Use real GraphQL URL
        graphql_url = server.url

        deps = SandboxAgentDeps(graphql_url=graphql_url)
        prompt = build_analysis_prompt(inputs["save_filename"], graphql_url)

        agent = get_sandbox_budget_agent(settings)
        mcp_server = get_mcp_server(settings)

        async with mcp_server:
            if model_name:
                with agent.override(model=model_name):
                    result = await agent.run(prompt, deps=deps)
            else:
                result = await agent.run(prompt, deps=deps)

        return result.output
```

### Configuration

#### Environment Variables

Reuse existing test database config from `.devcontainer/.env.db.test`:

```bash
STELLARIS_TEST_DB_HOST=db-test
STELLARIS_TEST_DB_PORT=5432
STELLARIS_TEST_DB_USER=stellaris_test
STELLARIS_TEST_DB_PASSWORD=stellaris_test
STELLARIS_TEST_DB_ADMIN_DATABASE=stellaris_test_admin
```

Add to Python Settings:

```python
class Settings(BaseSettings):
    # Existing fields...

    # Test database config for evals
    stellaris_test_db_host: str = "db-test"
    stellaris_test_db_port: int = 5432
    stellaris_test_db_user: str = "stellaris_test"
    stellaris_test_db_password: str = "stellaris_test"
    stellaris_test_db_admin_database: str = "stellaris_test_admin"
```

#### Network Configuration

The Python sandbox container needs to reach the GraphQL server. Options:

1. **Same container**: Run GraphQL server in devcontainer, accessible via localhost
2. **Docker network**: Ensure `stellaris-stats-mcp-run-python-network` can reach devcontainer

Since sandbox evals run from devcontainer, option 1 works:

- GraphQL server starts on localhost:{random_port}
- Python sandbox MCP server can reach it (same network)

### Dependencies

#### Python (add to agent/pyproject.toml)

```toml
[project]
dependencies = [
    # Existing deps...
    "asyncpg>=0.30.0",  # PostgreSQL async driver
]
```

#### TypeScript

No new dependencies - reuses existing test utilities.

### Migration Path

1. **Phase 1**: Create infrastructure
   - Add `test_database.py` for database management
   - Add `testGraphQLServerMain.ts` for server entry point
   - Add `server_manager.py` for process management
   - Add `fixture_loader.py` for SQL fixtures

2. **Phase 2**: Create SQL fixtures
   - Write converter from JSON to SQL, or
   - Manually create SQL fixtures for existing test cases

3. **Phase 3**: Update eval runners
   - Replace `start_mock_graphql_server` with `eval_environment`
   - Update both sandbox and non-sandbox datasets to use SQL fixture paths

4. **Phase 4**: Clean up mock infrastructure
   - Remove `mock_graphql_server.py` (no longer needed)
   - Simplify `mock_client.py` (kept for unit tests only)
   - Remove JSON fixtures

### File Structure (Current)

```
agent/src/agent/evals/
├── __init__.py
├── cli.py
├── test_database.py          # Database lifecycle management
├── server_manager.py         # Server subprocess management
├── fixture_loader.py         # SQL fixture loading
├── sandbox_runner.py         # Uses real GraphQL for sandbox evals
├── runner.py                 # Uses real GraphQL for non-sandbox evals
├── mock_client.py            # Simplified, for unit tests only
├── datasets/
│   ├── sudden_drop_detection.py          # Non-sandbox dataset
│   └── sandbox_sudden_drop_detection.py  # Sandbox dataset
├── evaluators/
│   └── output_quality.py
└── fixtures/
    └── sql/
        └── sudden_drop_detection/
            ├── trade_drop_only.sql
            └── energy_and_alloys_drop.sql

src/graphql/
├── graphqlServerMain.ts
├── testGraphQLServerMain.ts  # Test server entry point
└── ...
```

### npm Scripts

```json
{
  "scripts": {
    "graphql-server:test": "npx tsx src/graphql/testGraphQLServerMain.ts"
  }
}
```

### Comparison with TypeScript Tests

| Aspect            | TypeScript Tests              | Python Evals (Proposed)               |
| ----------------- | ----------------------------- | ------------------------------------- |
| Database creation | `createTestDatabase()`        | `create_test_database()`              |
| Migrations        | Direct node-pg-migrate        | subprocess → node-pg-migrate          |
| Fixture format    | SQL files                     | SQL files                             |
| Server creation   | `createTestServer()`          | subprocess → testGraphQLServerMain.ts |
| Server access     | `executeOperation()` (direct) | HTTP (via MCP sandbox)                |
| Redis             | Mock (in-memory)              | Mock (in-memory)                      |
| Cleanup           | `destroyTestDatabase()`       | `destroy_test_database()`             |

### Trade-offs

**Pros:**

- Tests real GraphQL server behavior
- Tests actual database queries and resolvers
- Same isolation pattern as TypeScript tests
- Catches integration issues between components

**Cons:**

- Slower than mock-based testing (subprocess overhead)
- More complex infrastructure
- Requires PostgreSQL and Node.js available
- SQL fixtures need maintenance if schema changes

### Alternative Approaches Considered

1. **HTTP proxy to mock server**: Add HTTP layer to existing mock, but still doesn't test real resolvers

2. **Python GraphQL server (Ariadne/Strawberry)**: Rewrite server in Python, but duplicates TypeScript code

3. **Shared database, no isolation**: Faster but tests can interfere with each other

4. **Container-per-test**: Maximum isolation but very slow

The proposed approach balances test fidelity with practical performance.
