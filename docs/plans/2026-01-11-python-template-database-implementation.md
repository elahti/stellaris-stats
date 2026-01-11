# Python Template Database Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Speed up Python eval database creation by using PostgreSQL template cloning instead of running migrations per test.

**Architecture:** Lazy-initialize a template database with migrations on first use, clone it for each test database, clean up template at end of eval session via context manager in CLI.

**Tech Stack:** Python, asyncpg, asyncio, PostgreSQL template databases

---

## Task 1: Update TestDatabaseContext and Add Module State

**Files:**
- Modify: `agent/src/agent/evals/test_database.py:1-21`

**Step 1: Update imports and add module-level state**

Replace lines 1-21 with:

```python
from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from uuid import uuid4

import asyncpg

from agent.settings import Settings, get_settings

TEMPLATE_DB_NAME = "stellaris_test_template"

_template_ready: asyncio.Task[None] | None = None
_template_settings: Settings | None = None


@dataclass
class TestDatabaseContext:
    pool: asyncpg.Pool[asyncpg.Record]
    db_name: str
    settings: Settings
```

**Step 2: Run type checker to verify**

Run: `npm run typecheck:python`
Expected: PASS (dataclass field change is internal)

**Step 3: Commit**

```bash
git add agent/src/agent/evals/test_database.py
git commit -m "refactor(evals): simplify TestDatabaseContext, add template state"
```

---

## Task 2: Add Template Creation Function

**Files:**
- Modify: `agent/src/agent/evals/test_database.py` (add after dataclass, before `create_test_database`)

**Step 1: Add _ensure_template function**

Add this function after the `TestDatabaseContext` dataclass (around line 24):

```python
async def _ensure_template(settings: Settings) -> None:
    """Create and migrate the template database (called once per session)."""
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
        await admin_conn.execute(f"DROP DATABASE IF EXISTS {TEMPLATE_DB_NAME}")
        await admin_conn.execute(f"CREATE DATABASE {TEMPLATE_DB_NAME}")
    finally:
        await admin_conn.close()

    await _run_migrations(
        db_name=TEMPLATE_DB_NAME,
        host=settings.stellaris_stats_db_host,
        port=settings.stellaris_stats_db_port,
        user=settings.stellaris_stats_db_user,
        password=settings.stellaris_stats_db_password,
    )
```

**Step 2: Run type checker**

Run: `npm run typecheck:python`
Expected: PASS

**Step 3: Commit**

```bash
git add agent/src/agent/evals/test_database.py
git commit -m "feat(evals): add template database creation function"
```

---

## Task 3: Update create_test_database to Use Template

**Files:**
- Modify: `agent/src/agent/evals/test_database.py` (replace `create_test_database` function)

**Step 1: Replace create_test_database function**

Replace the entire `create_test_database` function with:

```python
async def create_test_database(
    settings: Settings | None = None,
) -> TestDatabaseContext:
    if settings is None:
        settings = get_settings()

    global _template_ready
    if _template_ready is None:
        _template_ready = asyncio.create_task(_ensure_template(settings))
    await _template_ready

    db_name = f"stellaris_test_{uuid4().hex}"

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

**Step 2: Run type checker**

Run: `npm run typecheck:python`
Expected: FAIL - callers still pass old fields to `destroy_test_database`

**Step 3: Commit**

```bash
git add agent/src/agent/evals/test_database.py
git commit -m "feat(evals): create_test_database clones from template"
```

---

## Task 4: Update destroy_test_database Signature

**Files:**
- Modify: `agent/src/agent/evals/test_database.py` (replace `destroy_test_database` function)

**Step 1: Replace destroy_test_database function**

Replace the entire `destroy_test_database` function with:

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
            """
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = $1
              AND pid <> pg_backend_pid()
            """,
            ctx.db_name,
        )
        await admin_conn.execute(f"DROP DATABASE IF EXISTS {ctx.db_name}")
    finally:
        await admin_conn.close()
```

**Step 2: Run type checker**

Run: `npm run typecheck:python`
Expected: FAIL - callers pass extra `settings` argument

**Step 3: Commit**

```bash
git add agent/src/agent/evals/test_database.py
git commit -m "refactor(evals): simplify destroy_test_database signature"
```

---

## Task 5: Add destroy_test_template Function

**Files:**
- Modify: `agent/src/agent/evals/test_database.py` (add after `destroy_test_database`)

**Step 1: Add destroy_test_template function**

Add this function after `destroy_test_database`:

```python
async def destroy_test_template(settings: Settings | None = None) -> None:
    """Clean up the template database at end of eval session."""
    global _template_ready, _template_settings

    if _template_ready is None:
        return

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
            """
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = $1
              AND pid <> pg_backend_pid()
            """,
            TEMPLATE_DB_NAME,
        )
        await admin_conn.execute(f"DROP DATABASE IF EXISTS {TEMPLATE_DB_NAME}")
        _template_ready = None
        _template_settings = None
    finally:
        await admin_conn.close()
```

**Step 2: Run type checker**

Run: `npm run typecheck:python`
Expected: FAIL - callers still broken

**Step 3: Commit**

```bash
git add agent/src/agent/evals/test_database.py
git commit -m "feat(evals): add destroy_test_template for session cleanup"
```

---

## Task 6: Update sandbox_runner.py

**Files:**
- Modify: `agent/src/agent/evals/sandbox_runner.py:42`

**Step 1: Update destroy_test_database call**

Change line 42 from:
```python
        await destroy_test_database(db_ctx, settings)
```

To:
```python
        await destroy_test_database(db_ctx)
```

**Step 2: Run type checker**

Run: `npm run typecheck:python`
Expected: FAIL - other runners still broken

**Step 3: Commit**

```bash
git add agent/src/agent/evals/sandbox_runner.py
git commit -m "fix(evals): update sandbox_runner for new destroy_test_database signature"
```

---

## Task 7: Update neighbor_multi_runner.py

**Files:**
- Modify: `agent/src/agent/evals/neighbor_multi_runner.py:44`

**Step 1: Update destroy_test_database call**

Change line 44 from:
```python
        await destroy_test_database(db_ctx, settings)
```

To:
```python
        await destroy_test_database(db_ctx)
```

**Step 2: Commit**

```bash
git add agent/src/agent/evals/neighbor_multi_runner.py
git commit -m "fix(evals): update neighbor_multi_runner for new destroy_test_database signature"
```

---

## Task 8: Update neighbor_single_runner.py

**Files:**
- Modify: `agent/src/agent/evals/neighbor_single_runner.py:44`

**Step 1: Update destroy_test_database call**

Change line 44 from:
```python
        await destroy_test_database(db_ctx, settings)
```

To:
```python
        await destroy_test_database(db_ctx)
```

**Step 2: Commit**

```bash
git add agent/src/agent/evals/neighbor_single_runner.py
git commit -m "fix(evals): update neighbor_single_runner for new destroy_test_database signature"
```

---

## Task 9: Update root_cause_multi_runner.py

**Files:**
- Modify: `agent/src/agent/evals/root_cause_multi_runner.py:44`

**Step 1: Update destroy_test_database call**

Change line 44 from:
```python
        await destroy_test_database(db_ctx, settings)
```

To:
```python
        await destroy_test_database(db_ctx)
```

**Step 2: Commit**

```bash
git add agent/src/agent/evals/root_cause_multi_runner.py
git commit -m "fix(evals): update root_cause_multi_runner for new destroy_test_database signature"
```

---

## Task 10: Update root_cause_single_runner.py

**Files:**
- Modify: `agent/src/agent/evals/root_cause_single_runner.py:44`

**Step 1: Update destroy_test_database call**

Change line 44 from:
```python
        await destroy_test_database(db_ctx, settings)
```

To:
```python
        await destroy_test_database(db_ctx)
```

**Step 2: Commit**

```bash
git add agent/src/agent/evals/root_cause_single_runner.py
git commit -m "fix(evals): update root_cause_single_runner for new destroy_test_database signature"
```

---

## Task 11: Update native_budget_runner.py

**Files:**
- Modify: `agent/src/agent/evals/native_budget_runner.py:47`

**Step 1: Update destroy_test_database call**

Change line 47 from:
```python
        await destroy_test_database(db_ctx, settings)
```

To:
```python
        await destroy_test_database(db_ctx)
```

**Step 2: Run type checker - should pass now**

Run: `npm run typecheck:python`
Expected: PASS

**Step 3: Commit**

```bash
git add agent/src/agent/evals/native_budget_runner.py
git commit -m "fix(evals): update native_budget_runner for new destroy_test_database signature"
```

---

## Task 12: Add eval_session Context Manager to CLI

**Files:**
- Modify: `agent/src/agent/evals/cli.py:1-10` (update imports)

**Step 1: Update imports**

Replace lines 1-10 with:

```python
import argparse
import asyncio
import sys
from collections.abc import AsyncIterator, Callable, Coroutine
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Any

import logfire
from pydantic_evals import Dataset
```

**Step 2: Add import for destroy_test_template**

After line 30 (`from agent.settings import Settings, get_settings`), add:

```python
from agent.evals.test_database import destroy_test_template
```

**Step 3: Commit**

```bash
git add agent/src/agent/evals/cli.py
git commit -m "refactor(evals): add imports for eval_session context manager"
```

---

## Task 13: Add eval_session Context Manager

**Files:**
- Modify: `agent/src/agent/evals/cli.py` (add after imports, before `DatasetConfig`)

**Step 1: Add eval_session function**

Add this function after the imports (around line 33), before `@dataclass class DatasetConfig`:

```python
@asynccontextmanager
async def eval_session(settings: Settings) -> AsyncIterator[None]:
    """Context manager for eval session - ensures template cleanup."""
    try:
        yield
    finally:
        await destroy_test_template(settings)
```

**Step 2: Run type checker**

Run: `npm run typecheck:python`
Expected: PASS

**Step 3: Commit**

```bash
git add agent/src/agent/evals/cli.py
git commit -m "feat(evals): add eval_session context manager for template cleanup"
```

---

## Task 14: Wrap run_evals_for_models with eval_session

**Files:**
- Modify: `agent/src/agent/evals/cli.py` (update `run_evals_for_models` function)

**Step 1: Update run_evals_for_models**

Replace the `run_evals_for_models` function (around lines 82-100) with:

```python
async def run_evals_for_models(
    dataset_name: str,
    dataset: Any,
    models: list[str],
    settings: Settings,
) -> None:
    async with eval_session(settings):
        config = AVAILABLE_DATASETS[dataset_name]
        runner = config.runner
        for model in models:
            print(f"\n{'=' * 60}")
            print(f"Running evals with model: {model}")
            print("=" * 60)
            experiment_name = build_experiment_name(dataset_name, model)
            await runner(
                dataset,
                model,
                experiment_name,
                settings,
            )
```

**Step 2: Commit**

```bash
git add agent/src/agent/evals/cli.py
git commit -m "feat(evals): wrap multi-model runs with eval_session"
```

---

## Task 15: Wrap Single-Model Run with eval_session

**Files:**
- Modify: `agent/src/agent/evals/cli.py` (update `main` function, lines 169-178)

**Step 1: Update single-model execution in main()**

Replace lines 169-178 (the `if args.model:` block) with:

```python
    if args.model:
        experiment_name = build_experiment_name(dataset_name, args.model)

        async def run_single() -> None:
            async with eval_session(settings):
                await config.runner(
                    dataset,
                    args.model,
                    experiment_name,
                    settings,
                )

        asyncio.run(run_single())
    else:
        asyncio.run(
            run_evals_for_models(
                dataset_name,
                dataset,
                get_model_names(),
                settings,
            ),
        )
```

**Step 2: Run full quality checks**

Run: `npm run typecheck:python && npm run lint:python && npm run format:python`
Expected: PASS

**Step 3: Commit**

```bash
git add agent/src/agent/evals/cli.py
git commit -m "feat(evals): wrap single-model runs with eval_session"
```

---

## Task 16: Final Verification

**Step 1: Run all Python quality checks**

Run: `npm run typecheck:python && npm run lint:python && npm run format:python && npm run test:ci:python`
Expected: All PASS

**Step 2: Verify exports (optional)**

The `destroy_test_template` function should be importable. Verify the module works:

Run: `cd agent && uv run python -c "from agent.evals.test_database import destroy_test_template; print('OK')"`
Expected: `OK`

**Step 3: Final commit if any formatting changes**

```bash
git add -A
git commit -m "style(evals): apply formatting" --allow-empty
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Update TestDatabaseContext dataclass | test_database.py |
| 2 | Add _ensure_template function | test_database.py |
| 3 | Update create_test_database | test_database.py |
| 4 | Update destroy_test_database | test_database.py |
| 5 | Add destroy_test_template | test_database.py |
| 6-11 | Update runner files | 6 runner files |
| 12-13 | Add eval_session to CLI | cli.py |
| 14-15 | Wrap run paths with eval_session | cli.py |
| 16 | Final verification | - |
