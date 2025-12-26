from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from uuid import uuid4

import asyncpg

from agent.settings import Settings


@dataclass
class TestDatabaseContext:
    pool: asyncpg.Pool[asyncpg.Record]
    db_name: str
    host: str
    port: int
    user: str
    password: str


async def create_test_database(
    settings: Settings | None = None,
) -> TestDatabaseContext:
    if settings is None:
        settings = Settings()

    if settings.stellaris_test_db_host is None:
        raise ValueError("STELLARIS_TEST_DB_HOST environment variable not set")
    if settings.stellaris_test_db_user is None:
        raise ValueError("STELLARIS_TEST_DB_USER environment variable not set")
    if settings.stellaris_test_db_password is None:
        raise ValueError("STELLARIS_TEST_DB_PASSWORD environment variable not set")
    if settings.stellaris_test_db_admin_database is None:
        raise ValueError(
            "STELLARIS_TEST_DB_ADMIN_DATABASE environment variable not set",
        )

    db_name = f"stellaris_test_{uuid4().hex}"

    admin_conn = await asyncpg.connect(
        host=settings.stellaris_test_db_host,
        port=settings.stellaris_test_db_port,
        user=settings.stellaris_test_db_user,
        password=settings.stellaris_test_db_password,
        database=settings.stellaris_test_db_admin_database,
    )

    try:
        await admin_conn.execute(f"CREATE DATABASE {db_name}")
    finally:
        await admin_conn.close()

    await _run_migrations(
        db_name=db_name,
        host=settings.stellaris_test_db_host,
        port=settings.stellaris_test_db_port,
        user=settings.stellaris_test_db_user,
        password=settings.stellaris_test_db_password,
    )

    pool = await asyncpg.create_pool(
        host=settings.stellaris_test_db_host,
        port=settings.stellaris_test_db_port,
        user=settings.stellaris_test_db_user,
        password=settings.stellaris_test_db_password,
        database=db_name,
        min_size=1,
        max_size=10,
    )

    assert pool is not None, "Failed to create connection pool"

    return TestDatabaseContext(
        pool=pool,
        db_name=db_name,
        host=settings.stellaris_test_db_host,
        port=settings.stellaris_test_db_port,
        user=settings.stellaris_test_db_user,
        password=settings.stellaris_test_db_password,
    )


async def destroy_test_database(
    ctx: TestDatabaseContext,
    settings: Settings | None = None,
) -> None:
    if settings is None:
        settings = Settings()

    await ctx.pool.close()

    admin_conn = await asyncpg.connect(
        host=settings.stellaris_test_db_host,
        port=settings.stellaris_test_db_port,
        user=settings.stellaris_test_db_user,
        password=settings.stellaris_test_db_password,
        database=settings.stellaris_test_db_admin_database,
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
