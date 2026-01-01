#!/usr/bin/env python3
"""Generate SQL fixtures for eval tests by reading from production database.

Usage:
  python scripts/generate_sql_fixture.py \\
    --save commonwealthofman_1251622081 \\
    --start-date 2308-07-01 \\
    --end-date 2311-10-01 \\
    --output src/agent/evals/fixtures/sql/sudden_drop_detection/trade_drop_only.sql
"""

from __future__ import annotations

import argparse
import asyncio
from datetime import datetime
from pathlib import Path

import asyncpg

from agent.settings import get_settings

BUDGET_ENTRY_COLUMNS = [
    "energy",
    "minerals",
    "food",
    "alloys",
    "consumer_goods",
    "trade",
    "unity",
    "influence",
    "physics_research",
    "engineering_research",
    "society_research",
    "exotic_gases",
    "rare_crystals",
    "volatile_motes",
    "astral_threads",
    "minor_artifacts",
    "nanites",
    "sr_zro",
    "sr_dark_matter",
    "sr_living_metal",
]


def sql_str(value: str | datetime | None) -> str:
    if value is None:
        return "NULL"
    str_val = value.isoformat() if isinstance(value, datetime) else str(value)
    return "'" + str_val.replace("'", "''") + "'"


def sql_num(value: float | int | None) -> str:
    if value is None:
        return "NULL"
    return str(value)


def generate_sql_statements(
    save: asyncpg.Record,
    gamestates: list[asyncpg.Record],
    budget_data: list[asyncpg.Record],
    description: str,
) -> str:
    lines: list[str] = []

    lines.append(f"-- {description or 'Generated fixture'}")
    lines.append(f"-- Generated: {datetime.now().isoformat()}")
    lines.append(f"-- Gamestates: {len(gamestates)}")
    lines.append(f"-- Budget entries: {len(budget_data)}")
    lines.append("")

    lines.append("-- Save")
    filename_str = sql_str(save["filename"])
    name_str = sql_str(save["name"])
    lines.append(
        f"INSERT INTO save (filename, name) VALUES ({filename_str}, {name_str});",
    )
    lines.append("")

    lines.append("-- Gamestates")
    for gs in gamestates:
        date_str = sql_str(gs["date"])
        lines.append(
            "INSERT INTO gamestate (save_id, date, data) VALUES "
            + f"((SELECT save_id FROM save WHERE filename = {filename_str}), "
            + f"{date_str}, '{{}}'::jsonb);",
        )
    lines.append("")

    lines.append("-- Budget data")
    gamestate_dates: dict[int, datetime] = {
        gs["gamestate_id"]: gs["date"] for gs in gamestates
    }

    for row in budget_data:
        values = ", ".join(sql_num(row[col]) for col in BUDGET_ENTRY_COLUMNS)
        cols = ", ".join(BUDGET_ENTRY_COLUMNS)
        lines.append(f"INSERT INTO budget_entry ({cols}) VALUES ({values});")

        gs_date = gamestate_dates[row["gamestate_id"]]
        gs_date_str = sql_str(gs_date)
        cat_type_str = sql_str(row["category_type"])
        cat_name_str = sql_str(row["category_name"])
        lines.append(
            "INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id) VALUES ("
            + f"(SELECT gamestate_id FROM gamestate WHERE date = {gs_date_str} "
            + f"AND save_id = (SELECT save_id FROM save WHERE filename = {filename_str})), "
            + f"{cat_type_str}, {cat_name_str}, "
            + "(SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1));",
        )
        lines.append("")

    return "\n".join(lines)


async def generate_sql_fixture(
    save_filename: str,
    start_date: str,
    end_date: str,
    output_path: str,
    description: str = "",
) -> None:
    settings = get_settings()

    start_dt = datetime.fromisoformat(start_date)
    end_dt = datetime.fromisoformat(end_date)

    conn = await asyncpg.connect(
        host=settings.stellaris_stats_db_host,
        port=settings.stellaris_stats_db_port,
        database=settings.stellaris_stats_db_name,
        user=settings.stellaris_stats_db_user,
        password=settings.stellaris_stats_db_password,
    )

    try:
        save = await conn.fetchrow(
            "SELECT filename, name FROM save WHERE filename = $1",
            save_filename,
        )
        if not save:
            available_saves = await conn.fetch(
                "SELECT filename FROM save ORDER BY filename",
            )
            print(f"Error: Save '{save_filename}' not found")
            print("Available saves:")
            for s in available_saves:
                print(f"  - {s['filename']}")
            return

        gamestates = await conn.fetch(
            """
            SELECT g.gamestate_id, g.date
            FROM gamestate g
            JOIN save s ON g.save_id = s.save_id
            WHERE s.filename = $1
              AND g.date >= $2
              AND g.date <= $3
            ORDER BY g.date
            """,
            save_filename,
            start_dt,
            end_dt,
        )

        if not gamestates:
            print(
                f"Error: No gamestates found for '{save_filename}' between {start_date} and {end_date}",
            )
            return

        gamestate_ids = [g["gamestate_id"] for g in gamestates]
        budget_data = await conn.fetch(
            """
            SELECT
                bc.gamestate_id,
                bc.category_type,
                bc.category_name,
                be.*
            FROM budget_category bc
            JOIN budget_entry be ON bc.budget_entry_id = be.budget_entry_id
            WHERE bc.gamestate_id = ANY($1)
            ORDER BY bc.gamestate_id, bc.category_type, bc.category_name
            """,
            gamestate_ids,
        )

        sql = generate_sql_statements(
            save=save,
            gamestates=list(gamestates),
            budget_data=list(budget_data),
            description=description,
        )

        output = Path(output_path)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(sql)

        print(f"Fixture written to: {output}")
        print(f"  Gamestates: {len(gamestates)}")
        print(f"  Budget entries: {len(budget_data)}")

    finally:
        await conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate SQL fixtures for eval tests from production database",
    )

    parser.add_argument(
        "--save",
        type=str,
        required=True,
        help="Save filename to fetch data for",
    )
    parser.add_argument(
        "--start-date",
        type=str,
        required=True,
        help="Start date for filtering (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--end-date",
        type=str,
        required=True,
        help="End date for filtering (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--output",
        type=str,
        required=True,
        help="Output path for the SQL fixture file",
    )
    parser.add_argument(
        "--description",
        type=str,
        default="",
        help="Description to include in fixture header comment",
    )

    args = parser.parse_args()

    asyncio.run(
        generate_sql_fixture(
            save_filename=args.save,
            start_date=args.start_date,
            end_date=args.end_date,
            output_path=args.output,
            description=args.description,
        ),
    )


if __name__ == "__main__":
    main()
