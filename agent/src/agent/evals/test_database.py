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


async def create_test_database(
    settings: Settings | None = None,
) -> TestDatabaseContext:
    if settings is None:
        settings = get_settings()

    db_name = f"stellaris_test_{uuid4().hex}"

    admin_conn = await asyncpg.connect(
        host=settings.stellaris_stats_db_host,
        port=settings.stellaris_stats_db_port,
        user=settings.stellaris_stats_db_user,
        password=settings.stellaris_stats_db_password,
        database=settings.stellaris_stats_db_name,
    )

    try:
        await admin_conn.execute(f"CREATE DATABASE {db_name}")
    finally:
        await admin_conn.close()

    await _run_migrations(
        db_name=db_name,
        host=settings.stellaris_stats_db_host,
        port=settings.stellaris_stats_db_port,
        user=settings.stellaris_stats_db_user,
        password=settings.stellaris_stats_db_password,
    )

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

    return TestDatabaseContext(
        pool=pool,
        db_name=db_name,
        settings=settings,
    )


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


async def _run_migrations(
    db_name: str,
    host: str,
    port: int,
    user: str,
    password: str,
) -> None:
    database_url = f"postgres://{user}:{password}@{host}:{port}/{db_name}"
    env = {
        **os.environ,
        "DATABASE_URL": database_url,
    }

    process = await asyncio.create_subprocess_exec(
        "npx",
        "node-pg-migrate",
        "up",
        "--migrations-dir",
        "./migrations",
        "--migrations-table",
        "stellaris_test_migrations",
        env=env,
        cwd="/workspace",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    stdout, stderr = await process.communicate()

    if process.returncode != 0:
        error_msg = stderr.decode() if stderr else stdout.decode()
        raise RuntimeError(
            f"Migration failed with code {process.returncode}: {error_msg}",
        )
