#!/usr/bin/env python3
"""Generate JSON fixtures for eval tests by querying the real GraphQL API.

Usage:
  python scripts/generate_fixture.py \\
    --save test_save \\
    --start-date 2210-01-01 \\
    --end-date 2210-06-01 \\
    --output src/agent/evals/fixtures/sustained_drops/test_save.json
"""

import argparse
import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Any

from agent.graphql_client import Client
from agent.settings import Settings

DATE_FORMAT = "%Y-%m-%d"


def parse_stellaris_date(date_str: str) -> datetime:
    """Parse Stellaris date format (YYYY-MM-DD or ISO datetime)."""
    return datetime.strptime(date_str[:10], DATE_FORMAT)


def filter_gamestates_by_date(
    gamestates: list[dict[str, Any]],
    start_date: str,
    end_date: str,
) -> list[dict[str, Any]]:
    """Filter gamestates to only include those within the date range."""
    start = parse_stellaris_date(start_date)
    end = parse_stellaris_date(end_date)

    filtered: list[dict[str, Any]] = []
    for gs in gamestates:
        gs_date = parse_stellaris_date(str(gs["date"]))
        if start <= gs_date <= end:
            filtered.append(gs)

    return filtered


async def generate_fixture(
    save_filename: str,
    start_date: str,
    end_date: str,
    output_path: str,
    description: str = "",
) -> None:
    """Generate a fixture file from the real GraphQL API."""
    settings = Settings()
    client = Client(url=settings.graphql_url)

    list_saves_result = await client.list_saves()

    matching_saves = [s for s in list_saves_result.saves if s.filename == save_filename]

    if not matching_saves:
        print(f"Error: Save '{save_filename}' not found")
        print("Available saves:")
        for s in list_saves_result.saves:
            print(f"  - {s.filename}")
        return

    get_dates_result = await client.get_dates(filename=save_filename)
    if get_dates_result.save is None:
        print(f"Error: No gamestates found for '{save_filename}'")
        return

    get_budget_result = await client.get_budget(filename=save_filename)
    if get_budget_result.save is None:
        print(f"Error: No budget data found for '{save_filename}'")
        return

    dates_data = get_dates_result.model_dump(by_alias=True)
    budget_data = get_budget_result.model_dump(by_alias=True)

    dates_data["save"]["gamestates"] = filter_gamestates_by_date(
        dates_data["save"]["gamestates"],
        start_date,
        end_date,
    )

    budget_data["save"]["gamestates"] = filter_gamestates_by_date(
        budget_data["save"]["gamestates"],
        start_date,
        end_date,
    )

    fixture: dict[str, Any] = {
        "metadata": {
            "description": description or f"Fixture for {save_filename}",
            "save_filename": save_filename,
            "date_range": {"start": start_date, "end": end_date},
            "generated_at": datetime.now().isoformat(),
        },
        "list_saves": {
            "saves": [{"filename": s.filename, "name": s.name} for s in matching_saves],
        },
        "get_dates": {
            save_filename: dates_data,
        },
        "get_budget": {
            save_filename: budget_data,
        },
    }

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(fixture, indent=2, default=str))

    print(f"Fixture written to: {output}")
    print(f"  Gamestates included: {len(dates_data['save']['gamestates'])}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate JSON fixtures for eval tests",
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
        help="Output path for the fixture JSON file",
    )
    parser.add_argument(
        "--description",
        type=str,
        default="",
        help="Description to include in fixture metadata",
    )

    args = parser.parse_args()

    asyncio.run(
        generate_fixture(
            save_filename=args.save,
            start_date=args.start_date,
            end_date=args.end_date,
            output_path=args.output,
            description=args.description,
        ),
    )


if __name__ == "__main__":
    main()
