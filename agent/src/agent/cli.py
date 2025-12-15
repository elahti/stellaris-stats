import argparse
import asyncio
import sys

import httpx
import logfire

from agent.models import BudgetAnalysisResult
from agent.settings import Settings
from agent.tools import AgentDeps, list_saves


async def run_list_saves() -> None:
    """List all available save files."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        saves = await list_saves(client)
        if not saves:
            print("No save files available.")
            return
        print("Available saves:")
        for save in saves:
            print(f"  - {save['filename']} ({save['name']})")


async def run_analysis(save_filename: str, threshold: float) -> None:
    """Run budget analysis for a specific save."""
    from agent.budget_agent import budget_agent

    async with httpx.AsyncClient(timeout=60.0) as client:
        deps = AgentDeps(http_client=client, threshold_percent=threshold)

        prompt = (
            f"Analyze the budget for save '{save_filename}'. "
            f"Identify any sudden changes in resource production that exceed {threshold}% "
            f"by comparing the latest date to approximately one year prior. "
            f"Return the analysis result."
        )

        result = await budget_agent.run(prompt, deps=deps)

        output: BudgetAnalysisResult = result.output
        print_analysis_result(output)


def print_analysis_result(result: BudgetAnalysisResult) -> None:
    """Print the analysis result in a readable format."""
    print("=" * 60)
    print("STELLARIS BUDGET ANALYSIS REPORT")
    print("=" * 60)
    print(f"Save: {result.save_filename}")
    print(f"Period: {result.previous_date} to {result.current_date}")
    print(f"Threshold: {result.threshold_percent}%")
    print("-" * 60)
    print(f"\nSummary: {result.summary}")

    if result.sudden_changes:
        print("\n" + "=" * 60)
        print("DETAILED CHANGES")
        print("=" * 60)

        for change in result.sudden_changes:
            print(f"\n[{change.category_type.upper()}] {change.category_name}")
            print("-" * 40)

            for rc in change.changes:
                direction = "▲" if rc.change_percent > 0 else "▼"
                color_start = ""
                color_end = ""

                if sys.stdout.isatty():
                    color_start = "\033[92m" if rc.change_percent > 0 else "\033[91m"
                    color_end = "\033[0m"

                print(
                    f"  {color_start}{direction} {rc.resource}: {rc.previous_value:.2f} → {rc.current_value:.2f} ({rc.change_percent:+.1f}%){color_end}",
                )
    else:
        print("\nNo significant changes detected.")

    print("\n" + "=" * 60)


def main() -> None:
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Analyze Stellaris empire budget for sudden changes",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  budget-analyzer --list-saves
  budget-analyzer --save commonwealthofman_1251622081
  budget-analyzer --save myempire --threshold 20
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
        "--threshold",
        type=float,
        default=15.0,
        help="Percentage threshold for detecting sudden changes (default: 15.0)",
    )

    args = parser.parse_args()

    settings = Settings()

    logfire.configure(
        service_name="stellaris-stats-agent",
        token=settings.stellaris_stats_logfire_token,
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
        asyncio.run(run_analysis(args.save, args.threshold))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
