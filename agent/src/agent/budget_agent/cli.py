import argparse
import asyncio
import dataclasses
import json
import sys

import logfire

from agent.budget_agent.agent import DROP_THRESHOLD_PERCENT, run_budget_analysis
from agent.budget_agent.models import SuddenDropAnalysisResult
from agent.budget_agent.tools import list_saves
from agent.settings import Settings


async def run_list_saves(settings: Settings) -> None:
    client = settings.create_graphql_client()
    saves = await list_saves(client)
    if not saves:
        print("No save files available.")
        return
    print("Available saves:")
    for save in saves:
        print(f"  - {save.filename} ({save.name})")


async def run_analysis(
    save_filename: str,
    *,
    raw: bool = False,
    model: str | None = None,
) -> None:
    result = await run_budget_analysis(save_filename, model_name=model)
    if raw:
        print(json.dumps(dataclasses.asdict(result), indent=2, default=str))
    else:
        print_analysis_result(result.output)


def print_analysis_result(result: SuddenDropAnalysisResult) -> None:
    print("=" * 60)
    print("STELLARIS SUDDEN DROP ANALYSIS REPORT")
    print("=" * 60)
    print(f"Save: {result.save_filename}")
    print(f"Period: {result.analysis_period_start} to {result.analysis_period_end}")
    print(f"Datapoints: {result.datapoints_analyzed}")
    print(f"Threshold: {DROP_THRESHOLD_PERCENT}% drop")
    print("-" * 60)
    print(f"\nSummary: {result.summary}")

    if result.sudden_drops:
        print("\n" + "=" * 60)
        print("SUDDEN DROPS DETECTED")
        print("=" * 60)

        for drop in result.sudden_drops:
            print(f"\n[{drop.resource}]")
            print("-" * 40)

            color_start = ""
            color_end = ""

            if sys.stdout.isatty():
                color_start = "\033[91m"
                color_end = "\033[0m"

            print(
                f"  {color_start}▼ Drop: {drop.drop_percent:.1f}% ({drop.drop_absolute:.2f}){color_end}",
            )
            print(f"    Start ({drop.start_date}): {drop.start_value:.2f}")
            print(f"    End ({drop.end_date}): {drop.end_value:.2f}")
    else:
        print("\nNo sudden drops detected.")

    print("\n" + "=" * 60)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Analyze Stellaris empire budget for sudden changes",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  budget-analyzer --save commonwealthofman_1251622081
  budget-analyzer --save commonwealthofman_1251622081 --raw
  budget-analyzer --save commonwealthofman_1251622081 --model openai:gpt-5.2-2025-12-11
        """,
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
    parser.add_argument(
        "--model",
        type=str,
        help="Model to use (overrides default agent model)",
    )

    args = parser.parse_args()

    if args.save:
        settings = Settings()

        logfire.configure(
            service_name="stellaris-stats-agent",
            token=settings.logfire_token,
            console=logfire.ConsoleOptions(),
            send_to_logfire=True,
        )
        logfire.instrument_pydantic_ai()
        logfire.instrument_httpx()

        asyncio.run(run_analysis(args.save, raw=args.raw, model=args.model))
    else:
        parser.print_help()
        sys.exit(1)


def list_saves_main() -> None:
    settings = Settings()
    asyncio.run(run_list_saves(settings))


if __name__ == "__main__":
    main()
