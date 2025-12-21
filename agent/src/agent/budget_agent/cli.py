import argparse
import asyncio
import dataclasses
import json
import sys

import logfire

from agent.budget_agent.agent import CONSECUTIVE_PERIODS_THRESHOLD, run_budget_analysis
from agent.budget_agent.models import SustainedDropAnalysisResult
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


def print_analysis_result(result: SustainedDropAnalysisResult) -> None:
    print("=" * 60)
    print("STELLARIS SUSTAINED DROP ANALYSIS REPORT")
    print("=" * 60)
    print(f"Save: {result.save_filename}")
    print(f"Period: {result.analysis_period_start} to {result.analysis_period_end}")
    print(f"Datapoints: {result.datapoints_analyzed}")
    print(f"Threshold: {CONSECUTIVE_PERIODS_THRESHOLD}+ consecutive periods")
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
