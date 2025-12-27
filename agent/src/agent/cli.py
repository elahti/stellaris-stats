import argparse
import asyncio
import dataclasses
import json
import sys
from enum import StrEnum, auto

import logfire

from agent.budget_agent.agent import (
    DROP_THRESHOLD_PERCENT,
    run_budget_analysis,
)
from agent.budget_agent.tools import list_saves
from agent.constants import AVAILABLE_MODELS
from agent.models import SuddenDropAnalysisResult
from agent.sandbox_budget_agent.agent import run_sandbox_budget_analysis
from agent.settings import Settings


class AgentType(StrEnum):
    NATIVE = auto()
    SANDBOX = auto()


def print_analysis_result(
    result: SuddenDropAnalysisResult,
    agent_type: AgentType,
) -> None:
    suffix = " (SANDBOX)" if agent_type == AgentType.SANDBOX else ""
    print("=" * 60)
    print(f"STELLARIS SUDDEN DROP ANALYSIS REPORT{suffix}")
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


def configure_logfire(settings: Settings, agent_type: AgentType) -> None:
    service_name = (
        "stellaris-stats-sandbox-agent"
        if agent_type == AgentType.SANDBOX
        else "stellaris-stats-agent"
    )
    logfire.configure(
        service_name=service_name,
        token=settings.logfire_token,
        console=logfire.ConsoleOptions(),
        send_to_logfire=True,
    )
    logfire.instrument_pydantic_ai()
    logfire.instrument_httpx()


async def run_list_saves_async(settings: Settings) -> None:
    client = settings.create_graphql_client()
    saves = await list_saves(client)
    if not saves:
        print("No save files available.")
        return
    print("Available saves:")
    for save in saves:
        print(f"  - {save.filename} ({save.name})")


async def run_analysis_async(
    save_filename: str,
    agent_type: AgentType,
    *,
    raw: bool = False,
    model: str | None = None,
) -> None:
    if agent_type == AgentType.SANDBOX:
        result = await run_sandbox_budget_analysis(save_filename, model_name=model)
    else:
        result = await run_budget_analysis(save_filename, model_name=model)

    if raw:
        print(json.dumps(dataclasses.asdict(result), indent=2, default=str))
    else:
        print_analysis_result(result.output, agent_type)


def cmd_analyze(args: argparse.Namespace) -> None:
    settings = Settings()
    agent_type = AgentType.SANDBOX if args.sandbox else AgentType.NATIVE
    configure_logfire(settings, agent_type)
    asyncio.run(
        run_analysis_async(args.save, agent_type, raw=args.raw, model=args.model),
    )


def cmd_list_saves(args: argparse.Namespace) -> None:
    del args
    settings = Settings()
    asyncio.run(run_list_saves_async(settings))


def cmd_list_models(args: argparse.Namespace) -> None:
    del args
    print("Available models:")
    for model in AVAILABLE_MODELS:
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
  agent analyze --save commonwealthofman_1251622081
  agent analyze --save commonwealthofman_1251622081 --raw
  agent analyze --save commonwealthofman_1251622081 --model openai:gpt-5.2-2025-12-11
  agent analyze --save commonwealthofman_1251622081 --sandbox
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
        "--model",
        type=str,
        help="Model to use (overrides default agent model)",
    )
    analyze_parser.add_argument(
        "--sandbox",
        action="store_true",
        help="Use the sandbox agent (MCP-based) instead of native tools",
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
