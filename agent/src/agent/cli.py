import argparse
import asyncio
import json
import sys

import logfire

from agent.constants import get_model_names
from agent.models import MultiAgentAnalysisResult, SuddenDropAnalysisResult
from agent.native_budget import run_native_budget_analysis
from agent.neighbor import NeighborAnalysisResult
from agent.neighbor_multi import run_neighbor_multi_agent_orchestration
from agent.neighbor_single import run_neighbor_single_agent_analysis
from agent.root_cause_multi.agent import run_root_cause_multi_agent_analysis
from agent.root_cause_single import run_root_cause_single_agent_analysis
from agent.sandbox import run_sandbox_drop_detection_analysis
from agent.settings import Settings, get_settings

ANALYSIS_TYPES = [
    "root-cause-multi",
    "root-cause-single",
    "native-budget",
    "sandbox",
    "neighbor-multi",
    "neighbor-single",
]


def print_multi_agent_result(result: MultiAgentAnalysisResult) -> None:
    print("=" * 60)
    print("STELLARIS BUDGET ANALYSIS REPORT")
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


def print_sudden_drop_result(result: SuddenDropAnalysisResult) -> None:
    print("=" * 60)
    print("STELLARIS DROP DETECTION REPORT")
    print("=" * 60)
    print(f"Save: {result.save_filename}")
    print(f"Period: {result.analysis_period_start} to {result.analysis_period_end}")
    print(f"Datapoints: {result.datapoints_analyzed}")
    print(f"Threshold: {result.drop_threshold_percent}% drop")
    print("-" * 60)
    print(f"\nSummary: {result.summary}")

    for drop in result.sudden_drops:
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

    if not result.sudden_drops:
        print("\nNo sudden drops detected.")

    print("\n" + "=" * 60)


def print_neighbor_result(result: NeighborAnalysisResult) -> None:
    print("=" * 60)
    print("STELLARIS NEIGHBOR ANALYSIS REPORT")
    print("=" * 60)
    print(f"Save: {result.save_filename}")
    print(f"Date: {result.analysis_date}")
    print(f"Player: {result.player_empire_name}")
    print(f"Owned Planets: {result.player_owned_planets}")
    print("-" * 60)
    print(f"\nSummary: {result.summary}")

    if result.neighbors:
        print("\n" + "-" * 60)
        print("NEAREST NEIGHBORS (sorted by distance):")
        print("-" * 60)

        for neighbor in result.neighbors:
            hostile_marker = " [HOSTILE]" if neighbor.is_hostile else ""
            opinion_str = (
                f"{neighbor.opinion:+.0f}" if neighbor.opinion is not None else "N/A"
            )

            print(f"\n  {neighbor.name}{hostile_marker}")
            print(f"    Distance: {neighbor.min_distance:.1f}")
            print(f"    Planets: {neighbor.owned_planet_count}")
            print(f"    Opinion: {opinion_str}")

            if neighbor.trust is not None:
                print(f"    Trust: {neighbor.trust:+.0f}")
            if neighbor.threat is not None:
                print(f"    Threat: {neighbor.threat:.0f}")

            if neighbor.opinion_modifiers:
                print("    Opinion Modifiers:")
                for mod in neighbor.opinion_modifiers:
                    print(f"      - {mod.modifier_type}: {mod.value:+.0f}")

    if result.key_findings:
        print("\n" + "-" * 60)
        print("KEY FINDINGS:")
        print("-" * 60)

        for finding in result.key_findings:
            color_start = ""
            color_end = ""
            if sys.stdout.isatty():
                if finding.severity == "critical":
                    color_start = "\033[91m"
                elif finding.severity == "warning":
                    color_start = "\033[93m"
                else:
                    color_start = "\033[94m"
                color_end = "\033[0m"

            print(
                f"  {color_start}[{finding.severity.upper()}]{color_end} {finding.description}",
            )

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
    analysis_type: str,
    save_filename: str,
    *,
    raw: bool = False,
) -> None:
    result: MultiAgentAnalysisResult | SuddenDropAnalysisResult | NeighborAnalysisResult

    if analysis_type == "root-cause-multi":
        result = await run_root_cause_multi_agent_analysis(save_filename)
        if raw:
            print(json.dumps(result.model_dump(), indent=2, default=str))
        else:
            print_multi_agent_result(result)

    elif analysis_type == "root-cause-single":
        result = await run_root_cause_single_agent_analysis(save_filename)
        if raw:
            print(json.dumps(result.model_dump(), indent=2, default=str))
        else:
            print_multi_agent_result(result)

    elif analysis_type == "native-budget":
        native_result = await run_native_budget_analysis(save_filename)
        if raw:
            print(json.dumps(native_result.output.model_dump(), indent=2, default=str))
        else:
            print_sudden_drop_result(native_result.output)

    elif analysis_type == "sandbox":
        sandbox_result = await run_sandbox_drop_detection_analysis(save_filename)
        if raw:
            print(json.dumps(sandbox_result.output.model_dump(), indent=2, default=str))
        else:
            print_sudden_drop_result(sandbox_result.output)

    elif analysis_type == "neighbor-multi":
        result = await run_neighbor_multi_agent_orchestration(save_filename)
        if raw:
            print(json.dumps(result.model_dump(), indent=2, default=str))
        else:
            print_neighbor_result(result)

    elif analysis_type == "neighbor-single":
        result = await run_neighbor_single_agent_analysis(save_filename)
        if raw:
            print(json.dumps(result.model_dump(), indent=2, default=str))
        else:
            print_neighbor_result(result)


def cmd_analyze(args: argparse.Namespace) -> None:
    settings = get_settings()
    configure_logfire(settings)

    try:
        asyncio.run(
            run_analysis_async(
                args.type,
                args.save,
                raw=args.raw,
            ),
        )
    except Exception as e:
        print(f"Error running analysis: {e}", file=sys.stderr)
        sys.exit(1)


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
        help="Analyze a save file using various agent types",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  agent analyze --type root-cause-multi --save commonwealthofman_1251622081
  agent analyze --type root-cause-single --save commonwealthofman_1251622081
  agent analyze --type native-budget --save commonwealthofman_1251622081
  agent analyze --type sandbox --save commonwealthofman_1251622081
  agent analyze --type neighbor-multi --save commonwealthofman_1251622081
  agent analyze --type neighbor-single --save commonwealthofman_1251622081
  agent analyze --type root-cause-multi --save commonwealthofman_1251622081 --raw
        """,
    )
    analyze_parser.add_argument(
        "--type",
        type=str,
        choices=ANALYSIS_TYPES,
        required=True,
        help="Analysis type to run",
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
