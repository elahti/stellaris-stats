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
from dataclasses import dataclass
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


def sql_bool(value: bool | None) -> str:
    if value is None:
        return "NULL"
    return "TRUE" if value else "FALSE"


@dataclass
class FixtureData:
    save: asyncpg.Record
    gamestates: list[asyncpg.Record]
    budget_data: list[asyncpg.Record]
    planet_coordinates: list[asyncpg.Record]
    empires: list[asyncpg.Record]
    empire_planets: list[asyncpg.Record]
    diplomatic_relations: list[asyncpg.Record]
    opinion_modifiers: list[asyncpg.Record]


def generate_sql_statements(
    data: FixtureData,
    description: str,
) -> str:
    lines: list[str] = []

    lines.append(f"-- {description or 'Generated fixture'}")
    lines.append(f"-- Generated: {datetime.now().isoformat()}")
    lines.append(f"-- Gamestates: {len(data.gamestates)}")
    lines.append(f"-- Budget entries: {len(data.budget_data)}")
    lines.append(f"-- Planet coordinates: {len(data.planet_coordinates)}")
    lines.append(f"-- Empires: {len(data.empires)}")
    lines.append(f"-- Empire planets: {len(data.empire_planets)}")
    lines.append(f"-- Diplomatic relations: {len(data.diplomatic_relations)}")
    lines.append(f"-- Opinion modifiers: {len(data.opinion_modifiers)}")
    lines.append("")

    filename_str = sql_str(data.save["filename"])
    name_str = sql_str(data.save["name"])

    gamestate_dates: dict[int, datetime] = {
        gs["gamestate_id"]: gs["date"] for gs in data.gamestates
    }

    lines.append("-- Save")
    lines.append(
        f"INSERT INTO save (filename, name) VALUES ({filename_str}, {name_str});",
    )
    lines.append("")

    lines.append("-- Gamestates")
    for gs in data.gamestates:
        date_str = sql_str(gs["date"])
        lines.append(
            "INSERT INTO gamestate (save_id, date, data) VALUES "
            + f"((SELECT save_id FROM save WHERE filename = {filename_str}), "
            + f"{date_str}, '{{}}'::jsonb);",
        )
    lines.append("")

    if data.budget_data:
        lines.append("-- Budget data")
        for row in data.budget_data:
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

    if data.planet_coordinates:
        lines.append("-- Planet coordinates")
        for row in data.planet_coordinates:
            gs_date = gamestate_dates[row["gamestate_id"]]
            gs_date_str = sql_str(gs_date)
            planet_id = sql_num(row["planet_id"])
            x = sql_num(row["x"])
            y = sql_num(row["y"])
            system_id = sql_num(row["system_id"])
            lines.append(
                "INSERT INTO planet_coordinate (gamestate_id, planet_id, x, y, system_id) VALUES ("
                + f"(SELECT gamestate_id FROM gamestate WHERE date = {gs_date_str} "
                + f"AND save_id = (SELECT save_id FROM save WHERE filename = {filename_str})), "
                + f"{planet_id}, {x}, {y}, {system_id});",
            )
        lines.append("")

    if data.empires:
        lines.append("-- Empires")
        for row in data.empires:
            gs_date = gamestate_dates[row["gamestate_id"]]
            gs_date_str = sql_str(gs_date)
            country_id = sql_str(row["country_id"])
            empire_name = sql_str(row["name"])
            is_player = sql_bool(row["is_player"])
            capital_planet_id = sql_num(row["capital_planet_id"])
            owned_planet_count = sql_num(row["owned_planet_count"])
            controlled_planet_count = sql_num(row["controlled_planet_count"])
            military_power = sql_num(row["military_power"])
            economy_power = sql_num(row["economy_power"])
            tech_power = sql_num(row["tech_power"])
            lines.append(
                "INSERT INTO empire (gamestate_id, country_id, name, is_player, capital_planet_id, "
                + "owned_planet_count, controlled_planet_count, military_power, economy_power, tech_power) VALUES ("
                + f"(SELECT gamestate_id FROM gamestate WHERE date = {gs_date_str} "
                + f"AND save_id = (SELECT save_id FROM save WHERE filename = {filename_str})), "
                + f"{country_id}, {empire_name}, {is_player}, {capital_planet_id}, "
                + f"{owned_planet_count}, {controlled_planet_count}, {military_power}, {economy_power}, {tech_power});",
            )
        lines.append("")

    if data.empire_planets:
        lines.append("-- Empire planets")
        for row in data.empire_planets:
            gs_date = gamestate_dates[row["gamestate_id"]]
            gs_date_str = sql_str(gs_date)
            country_id = sql_str(row["country_id"])
            planet_id = sql_num(row["planet_id"])
            lines.append(
                "INSERT INTO empire_planet (gamestate_id, country_id, planet_id) VALUES ("
                + f"(SELECT gamestate_id FROM gamestate WHERE date = {gs_date_str} "
                + f"AND save_id = (SELECT save_id FROM save WHERE filename = {filename_str})), "
                + f"{country_id}, {planet_id});",
            )
        lines.append("")

    if data.diplomatic_relations:
        lines.append("-- Diplomatic relations")
        for row in data.diplomatic_relations:
            gs_date = gamestate_dates[row["gamestate_id"]]
            gs_date_str = sql_str(gs_date)
            source_country_id = sql_str(row["source_country_id"])
            target_country_id = sql_str(row["target_country_id"])
            opinion = sql_num(row["opinion"])
            trust = sql_num(row["trust"])
            threat = sql_num(row["threat"])
            is_hostile = sql_bool(row["is_hostile"])
            border_range = sql_num(row["border_range"])
            has_contact = sql_bool(row["has_contact"])
            has_communications = sql_bool(row["has_communications"])
            lines.append(
                "INSERT INTO diplomatic_relation (gamestate_id, source_country_id, target_country_id, "
                + "opinion, trust, threat, is_hostile, border_range, has_contact, has_communications) VALUES ("
                + f"(SELECT gamestate_id FROM gamestate WHERE date = {gs_date_str} "
                + f"AND save_id = (SELECT save_id FROM save WHERE filename = {filename_str})), "
                + f"{source_country_id}, {target_country_id}, {opinion}, {trust}, {threat}, "
                + f"{is_hostile}, {border_range}, {has_contact}, {has_communications});",
            )
        lines.append("")

    if data.opinion_modifiers:
        lines.append("-- Opinion modifiers")
        for row in data.opinion_modifiers:
            gs_date = gamestate_dates[row["gamestate_id"]]
            gs_date_str = sql_str(gs_date)
            source_country_id = sql_str(row["source_country_id"])
            target_country_id = sql_str(row["target_country_id"])
            modifier_type = sql_str(row["modifier_type"])
            value = sql_num(row["value"])
            lines.append(
                "INSERT INTO opinion_modifier (diplomatic_relation_id, modifier_type, value) VALUES ("
                + "(SELECT diplomatic_relation_id FROM diplomatic_relation WHERE "
                + f"gamestate_id = (SELECT gamestate_id FROM gamestate WHERE date = {gs_date_str} "
                + f"AND save_id = (SELECT save_id FROM save WHERE filename = {filename_str})) "
                + f"AND source_country_id = {source_country_id} AND target_country_id = {target_country_id}), "
                + f"{modifier_type}, {value});",
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

        planet_coordinates = await conn.fetch(
            """
            SELECT gamestate_id, planet_id, x, y, system_id
            FROM planet_coordinate
            WHERE gamestate_id = ANY($1)
            ORDER BY gamestate_id, planet_id
            """,
            gamestate_ids,
        )

        empires = await conn.fetch(
            """
            SELECT gamestate_id, country_id, name, is_player, capital_planet_id,
                   owned_planet_count, controlled_planet_count,
                   military_power, economy_power, tech_power
            FROM empire
            WHERE gamestate_id = ANY($1)
            ORDER BY gamestate_id, country_id
            """,
            gamestate_ids,
        )

        empire_planets = await conn.fetch(
            """
            SELECT gamestate_id, country_id, planet_id
            FROM empire_planet
            WHERE gamestate_id = ANY($1)
            ORDER BY gamestate_id, country_id, planet_id
            """,
            gamestate_ids,
        )

        diplomatic_relations = await conn.fetch(
            """
            SELECT gamestate_id, source_country_id, target_country_id,
                   opinion, trust, threat, is_hostile, border_range,
                   has_contact, has_communications
            FROM diplomatic_relation
            WHERE gamestate_id = ANY($1)
            ORDER BY gamestate_id, source_country_id, target_country_id
            """,
            gamestate_ids,
        )

        opinion_modifiers = await conn.fetch(
            """
            SELECT dr.gamestate_id, dr.source_country_id, dr.target_country_id,
                   om.modifier_type, om.value
            FROM opinion_modifier om
            JOIN diplomatic_relation dr ON om.diplomatic_relation_id = dr.diplomatic_relation_id
            WHERE dr.gamestate_id = ANY($1)
            ORDER BY dr.gamestate_id, dr.source_country_id, dr.target_country_id, om.modifier_type
            """,
            gamestate_ids,
        )

        fixture_data = FixtureData(
            save=save,
            gamestates=list(gamestates),
            budget_data=list(budget_data),
            planet_coordinates=list(planet_coordinates),
            empires=list(empires),
            empire_planets=list(empire_planets),
            diplomatic_relations=list(diplomatic_relations),
            opinion_modifiers=list(opinion_modifiers),
        )

        sql = generate_sql_statements(
            data=fixture_data,
            description=description,
        )

        output = Path(output_path)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(sql)

        print(f"Fixture written to: {output}")
        print(f"  Gamestates: {len(gamestates)}")
        print(f"  Budget entries: {len(budget_data)}")
        print(f"  Planet coordinates: {len(planet_coordinates)}")
        print(f"  Empires: {len(empires)}")
        print(f"  Empire planets: {len(empire_planets)}")
        print(f"  Diplomatic relations: {len(diplomatic_relations)}")
        print(f"  Opinion modifiers: {len(opinion_modifiers)}")

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
