import argparse
import asyncio
import dataclasses
import json
import sys

import logfire

from agent.budget_agent import run_budget_analysis
from agent.graphql_client import Client
from agent.models import SustainedDropAnalysisResult
from agent.settings import Settings
from agent.tools import GRAPHQL_URL, list_saves


async def run_list_saves() -> None:
    client = Client(url=GRAPHQL_URL)
    saves = await list_saves(client)
    if not saves:
        print("No save files available.")
        return
    print("Available saves:")
    for save in saves:
        print(f"  - {save.filename} ({save.name})")


async def run_analysis(save_filename: str, *, raw: bool = False) -> None:
    result = await run_budget_analysis(save_filename)
    if raw:
        print(json.dumps(dataclasses.asdict(result), indent=2, default=str))
    else:
        print_analysis_result(result.output)


def print_analysis_result(result: SustainedDropAnalysisResult) -> None:
    print("=" * 60)
    print("STELLARIS SUSTAINED DROP ANALYSIS REPORT")
    print("=" * 60)
    print(f"Save: {result.save_filename}")
    print(f"Period: {result.analysis_period_start} to {result.analysis_period_end}")
    print(f"Datapoints: {result.datapoints_analyzed}")
    print(f"Threshold: {result.threshold_consecutive_periods}+ consecutive periods")
    print("-" * 60)
    print(f"\nSummary: {result.summary}")

    if result.sustained_drops:
        print("\n" + "=" * 60)
        print("SUSTAINED DROPS DETECTED")
        print("=" * 60)

        for drop in result.sustained_drops:
            print(f"\n[{drop.category_name}] {drop.resource}")
            print("-" * 40)

            color_start = ""
            color_end = ""

            if sys.stdout.isatty():
                color_start = "\033[91m"
                color_end = "\033[0m"

            values_str = " → ".join(
                f"{v:.2f}" if v is not None else "null" for v in drop.values
            )
            print(
                f"  {color_start}▼ Consecutive periods: {drop.consecutive_low_periods}{color_end}",
            )
            print(f"    Baseline: {drop.baseline_value:.2f}")
            print(f"    Values: {values_str}")
    else:
        print("\nNo sustained drops detected.")

    print("\n" + "=" * 60)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Analyze Stellaris empire budget for sudden changes",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  budget-analyzer --list-saves
  budget-analyzer --save commonwealthofman_1251622081
  budget-analyzer --save commonwealthofman_1251622081 --raw
        """,
    )

    parser.add_argument(
        "--list-saves",
        action="store_true",
        help="List all available save files",
    )
    parser.add_argument(
        "--save",
        type=str,
        help="Save filename to analyze (without .sav extension)",
    )
    parser.add_argument(
        "--raw",
        action="store_true",
        help="Print raw JSON output instead of formatted report",
    )

    args = parser.parse_args()

    settings = Settings()

    logfire.configure(
        service_name="stellaris-stats-agent",
        token=settings.logfire_token,
        console=logfire.ConsoleOptions(),
        send_to_logfire=True,
    )
    logfire.instrument_pydantic_ai()
    logfire.instrument_httpx()

    if not settings.has_api_key() and not args.list_saves:
        print("Error: ANTHROPIC_API_KEY environment variable is not set.")
        print("Please set it or use dotenvx to load your secrets file.")
        sys.exit(1)

    if args.list_saves:
        asyncio.run(run_list_saves())
    elif args.save:
        asyncio.run(run_analysis(args.save, raw=args.raw))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
