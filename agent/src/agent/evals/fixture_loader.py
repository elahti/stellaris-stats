from __future__ import annotations

from pathlib import Path

import asyncpg

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "sql"


async def load_fixture(
    pool: asyncpg.Pool[asyncpg.Record],
    fixture_path: str,
) -> None:
    full_path = FIXTURES_DIR / fixture_path
    if not full_path.exists():
        raise FileNotFoundError(f"Fixture not found: {full_path}")

    sql = full_path.read_text()
    async with pool.acquire() as conn:
        await conn.execute(sql)
