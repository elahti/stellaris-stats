import argparse
import asyncio
import json
import sys

import logfire

from agent.constants import DEFAULT_MODEL, get_model_names
from agent.models import MultiAgentAnalysisResult
from agent.root_cause_multi_agent.agent import run_root_cause_multi_agent_analysis
from agent.settings import Settings, get_settings
from agent.thinking_settings import THINKING_LEVELS, ThinkingLevel, get_model_settings


def print_analysis_result(result: MultiAgentAnalysisResult) -> None:
    print("=" * 60)
    print("STELLARIS MULTI-AGENT ANALYSIS REPORT")
    print("=" * 60)
    print(f"Save: {result.save_filename}")
    print(f"Period: {result.analysis_period_start} to {result.analysis_period_end}")
    print(f"Datapoints: {result.datapoints_analyzed}")
    print(f"Threshold: {result.drop_threshold_percent}% drop")
    print("-" * 60)
    print(f"\nSummary: {result.summary}")

    for drop_with_cause in result.drops_with_root_causes:
        drop = drop_with_cause.drop
        print(f"\n{'=' * 60}")
        print(f"[{drop.resource}]")
        print("-" * 40)

        color_start = ""
        color_end = ""
        if sys.stdout.isatty():
            color_start = "\033[91m"
            color_end = "\033[0m"

        print(
            f"  {color_start}Drop: {drop.drop_percent:.1f}% "
            + f"({drop.drop_absolute:.2f}){color_end}",
        )
        print(f"    Start ({drop.start_date}): {drop.start_value:.2f}")
        print(f"    End ({drop.end_date}): {drop.end_value:.2f}")

        if drop_with_cause.analysis_error:
            print("\n  Root Cause Analysis: FAILED")
            print(f"    Error: {drop_with_cause.analysis_error}")
            continue

        if drop_with_cause.root_cause:
            print("\n  TOP 3 CONTRIBUTORS:")
            for contrib in drop_with_cause.root_cause.top_contributors:
                if contrib.contributor_type == "income_decreased":
                    label = "INCOME DOWN"
                    color = "\033[93m" if sys.stdout.isatty() else ""
                else:
                    label = "EXPENSES UP"
                    color = "\033[91m" if sys.stdout.isatty() else ""
                end_color = "\033[0m" if sys.stdout.isatty() else ""

                print(
                    f"    #{contrib.rank} {color}[{label}]{end_color} {contrib.category}",
                )
                change_line = (
                    f"       {contrib.before_value:.2f} -> {contrib.after_value:.2f} "
                    + f"({contrib.change_percent:+.1f}%)"
                )
                print(change_line)

            print(f"\n  Analysis: {drop_with_cause.root_cause.explanation}")

    if not result.drops_with_root_causes:
        print("\nNo sudden drops detected.")

    print("\n" + "=" * 60)


def configure_logfire(settings: Settings) -> None:
    logfire.configure(
        service_name="stellaris-stats-agent",
        token=settings.logfire_token,
        console=logfire.ConsoleOptions(),
        send_to_logfire=True,
    )
    logfire.instrument_pydantic_ai()
    logfire.instrument_httpx()


async def run_list_saves_async(settings: Settings) -> None:
    client = settings.create_graphql_client()
    result = await client.list_saves()
    saves = result.saves
    if not saves:
        print("No save files available.")
        return
    print("Available saves:")
    for save in saves:
        print(f"  - {save.filename} ({save.name})")


async def run_analysis_async(
    save_filename: str,
    *,
    raw: bool = False,
    parallel: bool = False,
    thinking: ThinkingLevel,
) -> None:
    result = await run_root_cause_multi_agent_analysis(
        save_filename,
        model_settings=get_model_settings(DEFAULT_MODEL, thinking),
        parallel_root_cause=parallel,
    )
    if raw:
        print(json.dumps(result.model_dump(), indent=2, default=str))
    else:
        print_analysis_result(result)


def cmd_analyze(args: argparse.Namespace) -> None:
    settings = get_settings()
    configure_logfire(settings)
    parallel = getattr(args, "parallel", False)
    asyncio.run(
        run_analysis_async(
            args.save,
            raw=args.raw,
            parallel=parallel,
            thinking=args.thinking,
        ),
    )


def cmd_list_saves(args: argparse.Namespace) -> None:
    del args
    settings = get_settings()
    asyncio.run(run_list_saves_async(settings))


def cmd_list_models(args: argparse.Namespace) -> None:
    del args
    print("Available models:")
    for model in get_model_names():
        print(f"  - {model}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Stellaris budget analysis agent CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    analyze_parser = subparsers.add_parser(
        "analyze",
        help="Analyze a save file for sudden budget drops",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  agent analyze --save commonwealthofman_1251622081 --thinking off
  agent analyze --save commonwealthofman_1251622081 --thinking high --raw
  agent analyze --save commonwealthofman_1251622081 --thinking high --parallel
        """,
    )
    analyze_parser.add_argument(
        "--save",
        type=str,
        required=True,
        help="Save filename to analyze (without .sav extension)",
    )
    analyze_parser.add_argument(
        "--raw",
        action="store_true",
        help="Print raw JSON output instead of formatted report",
    )
    analyze_parser.add_argument(
        "--parallel",
        action="store_true",
        help="Run root cause analyses in parallel",
    )
    analyze_parser.add_argument(
        "--thinking",
        type=str,
        choices=THINKING_LEVELS,
        required=True,
        help="Thinking/reasoning effort level",
    )
    analyze_parser.set_defaults(func=cmd_analyze)

    list_saves_parser = subparsers.add_parser(
        "list-saves",
        help="List available save files",
    )
    list_saves_parser.set_defaults(func=cmd_list_saves)

    list_models_parser = subparsers.add_parser(
        "list-models",
        help="List available AI models",
    )
    list_models_parser.set_defaults(func=cmd_list_models)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
