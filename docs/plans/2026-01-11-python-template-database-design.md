# Python Template Database Pattern

## Overview

Port TypeScript's template database optimization to Python evals. Currently, Python's `test_database.py` runs migrations on every test database creation via subprocess call to `npx node-pg-migrate`. This is slow compared to TypeScript's template-based cloning.

## Solution

1. Create `stellaris_test_template` once per eval run
2. Run migrations on template once
3. Clone template for each test case: `CREATE DATABASE {name} TEMPLATE stellaris_test_template`
4. Clean up template at end of eval session

## Data Structures

### Simplified TestDatabaseContext

Current structure stores redundant connection info:

```python
# Before
@dataclass
class TestDatabaseContext:
    pool: asyncpg.Pool[asyncpg.Record]
    db_name: str
    host: str      # Redundant
    port: int      # Redundant
    user: str      # Redundant
    password: str  # Redundant
```

New structure stores settings reference:

```python
# After
@dataclass
class TestDatabaseContext:
    pool: asyncpg.Pool[asyncpg.Record]
    db_name: str
    settings: Settings  # Contains all connection info
```

### Module-level Template State

```python
_template_ready: asyncio.Task[None] | None = None
_template_settings: Settings | None = None

TEMPLATE_DB_NAME = "stellaris_test_template"
```

## Implementation

### Template Creation

```python
async def _ensure_template(settings: Settings) -> None:
    global _template_settings
    _template_settings = settings

    admin_conn = await asyncpg.connect(
        host=settings.stellaris_stats_db_host,
        port=settings.stellaris_stats_db_port,
        user=settings.stellaris_stats_db_user,
        password=settings.stellaris_stats_db_password,
        database=settings.stellaris_stats_db_name,
    )

    try:
        # Drop existing template (handles stale templates from crashed runs)
        await admin_conn.execute(f"DROP DATABASE IF EXISTS {TEMPLATE_DB_NAME}")
        await admin_conn.execute(f"CREATE DATABASE {TEMPLATE_DB_NAME}")
    finally:
        await admin_conn.close()

    # Run migrations on template (existing subprocess approach)
    await _run_migrations(
        db_name=TEMPLATE_DB_NAME,
        host=settings.stellaris_stats_db_host,
        port=settings.stellaris_stats_db_port,
        user=settings.stellaris_stats_db_user,
        password=settings.stellaris_stats_db_password,
    )
```

### Test Database Creation (Using Template)

```python
async def create_test_database(
    settings: Settings | None = None,
) -> TestDatabaseContext:
    if settings is None:
        settings = get_settings()

    # Ensure template exists (lazy initialization, runs once)
    global _template_ready
    if _template_ready is None:
        _template_ready = asyncio.create_task(_ensure_template(settings))
    await _template_ready

    db_name = f"stellaris_test_{uuid4().hex}"

    # Clone from template instead of running migrations
    admin_conn = await asyncpg.connect(
        host=settings.stellaris_stats_db_host,
        port=settings.stellaris_stats_db_port,
        user=settings.stellaris_stats_db_user,
        password=settings.stellaris_stats_db_password,
        database=settings.stellaris_stats_db_name,
    )

    try:
        await admin_conn.execute(
            f"CREATE DATABASE {db_name} TEMPLATE {TEMPLATE_DB_NAME}"
        )
    finally:
        await admin_conn.close()

    pool = await asyncpg.create_pool(
        host=settings.stellaris_stats_db_host,
        port=settings.stellaris_stats_db_port,
        user=settings.stellaris_stats_db_user,
        password=settings.stellaris_stats_db_password,
        database=db_name,
        min_size=1,
        max_size=10,
    )

    assert pool is not None, "Failed to create connection pool"

    return TestDatabaseContext(pool=pool, db_name=db_name, settings=settings)
```

### Cleanup Functions

Simplified `destroy_test_database()` - no longer needs separate settings parameter:

```python
async def destroy_test_database(ctx: TestDatabaseContext) -> None:
    await ctx.pool.close()

    admin_conn = await asyncpg.connect(
        host=ctx.settings.stellaris_stats_db_host,
        port=ctx.settings.stellaris_stats_db_port,
        user=ctx.settings.stellaris_stats_db_user,
        password=ctx.settings.stellaris_stats_db_password,
        database=ctx.settings.stellaris_stats_db_name,
    )

    try:
        await admin_conn.execute(
            """SELECT pg_terminate_backend(pid)
               FROM pg_stat_activity
               WHERE datname = $1 AND pid <> pg_backend_pid()""",
            ctx.db_name,
        )
        await admin_conn.execute(f"DROP DATABASE IF EXISTS {ctx.db_name}")
    finally:
        await admin_conn.close()
```

New `destroy_test_template()` for end-of-run cleanup:

```python
async def destroy_test_template(settings: Settings | None = None) -> None:
    global _template_ready, _template_settings

    if _template_ready is None:
        return  # No template was created

    if settings is None:
        settings = _template_settings or get_settings()

    admin_conn = await asyncpg.connect(
        host=settings.stellaris_stats_db_host,
        port=settings.stellaris_stats_db_port,
        user=settings.stellaris_stats_db_user,
        password=settings.stellaris_stats_db_password,
        database=settings.stellaris_stats_db_name,
    )

    try:
        await admin_conn.execute(
            """SELECT pg_terminate_backend(pid)
               FROM pg_stat_activity
               WHERE datname = $1 AND pid <> pg_backend_pid()""",
            TEMPLATE_DB_NAME,
        )
        await admin_conn.execute(f"DROP DATABASE IF EXISTS {TEMPLATE_DB_NAME}")
        _template_ready = None
        _template_settings = None
    finally:
        await admin_conn.close()
```

### CLI Integration

Add session-scoped context manager to `cli.py`:

```python
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from agent.evals.test_database import destroy_test_template


@asynccontextmanager
async def eval_session(settings: Settings) -> AsyncIterator[None]:
    """Context manager for eval session - ensures template cleanup."""
    try:
        yield
    finally:
        await destroy_test_template(settings)


async def run_evals_for_models(
    dataset_name: str,
    dataset: Any,
    models: list[str],
    settings: Settings,
) -> None:
    async with eval_session(settings):  # Wrap the entire multi-model run
        config = AVAILABLE_DATASETS[dataset_name]
        runner = config.runner
        for model in models:
            print(f"\n{'=' * 60}")
            print(f"Running evals with model: {model}")
            print("=" * 60)
            experiment_name = build_experiment_name(dataset_name, model)
            await runner(dataset, model, experiment_name, settings)


# In main(), single-model case:
if args.model:
    async def run_single():
        async with eval_session(settings):
            await config.runner(dataset, args.model, experiment_name, settings)
    asyncio.run(run_single())
else:
    asyncio.run(run_evals_for_models(...))
```

## Files to Modify

| File | Changes |
|------|---------|
| `agent/src/agent/evals/test_database.py` | Add template pattern, simplify `TestDatabaseContext`, add `destroy_test_template()` |
| `agent/src/agent/evals/cli.py` | Add `eval_session()` context manager, wrap both run paths |
| `agent/src/agent/evals/sandbox_runner.py` | Update `destroy_test_database(ctx, settings)` to `destroy_test_database(ctx)` |
| `agent/src/agent/evals/neighbor_multi_runner.py` | Same signature update |
| `agent/src/agent/evals/neighbor_single_runner.py` | Same signature update |
| `agent/src/agent/evals/root_cause_multi_runner.py` | Same signature update |
| `agent/src/agent/evals/root_cause_single_runner.py` | Same signature update |
| `agent/src/agent/evals/native_budget_runner.py` | Same signature update |

## Breaking Changes

1. `TestDatabaseContext` fields change - code accessing `ctx.host`, `ctx.port`, etc. must use `ctx.settings.stellaris_stats_db_host` instead

2. `destroy_test_database()` signature changes - remove `settings` parameter since it's now in the context

## Expected Performance

- Before: Each eval case runs `npx node-pg-migrate up` subprocess (~2-5 seconds)
- After: First case creates template + migrations, subsequent cases clone (~100ms)

For a dataset with 10 cases, DB setup time reduces from ~30 seconds to ~5 seconds.

## Files Unchanged

- `fixture_loader.py` - unchanged
- `server_manager.py` - unchanged
- SQL test fixtures - unchanged
