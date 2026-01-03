import argparse
import asyncio
import sys
from dataclasses import dataclass
from typing import Any

import logfire

from agent.constants import get_model_names
from agent.evals.datasets.native_budget_agent import (
    create_native_budget_agent_dataset,
)
from agent.evals.datasets.root_cause_drop_detection import (
    create_root_cause_drop_detection_dataset,
)
from agent.evals.datasets.sandbox_drop_detection import (
    create_sandbox_drop_detection_dataset,
)
from agent.evals.native_budget_agent_runner import run_native_budget_agent_evals
from agent.evals.root_cause_multi_agent_runner import run_root_cause_multi_agent_evals
from agent.evals.root_cause_single_agent_runner import run_root_cause_single_agent_evals
from agent.evals.sandbox_drop_detection_runner import run_sandbox_drop_detection_evals
from agent.settings import Settings, get_settings


@dataclass
class DatasetConfig:
    create: Any
    runner: Any


AVAILABLE_DATASETS: dict[str, DatasetConfig] = {
    "root_cause_multi_agent_drop_detection": DatasetConfig(
        create=create_root_cause_drop_detection_dataset,
        runner=run_root_cause_multi_agent_evals,
    ),
    "root_cause_single_agent_drop_detection": DatasetConfig(
        create=create_root_cause_drop_detection_dataset,
        runner=run_root_cause_single_agent_evals,
    ),
    "native_budget_agent": DatasetConfig(
        create=create_native_budget_agent_dataset,
        runner=run_native_budget_agent_evals,
    ),
    "sandbox_drop_detection": DatasetConfig(
        create=create_sandbox_drop_detection_dataset,
        runner=run_sandbox_drop_detection_evals,
    ),
}


def build_experiment_name(
    dataset_name: str,
    model_name: str,
) -> str:
    model_short = model_name.split(":")[-1] if ":" in model_name else model_name
    return f"{dataset_name}_{model_short}"


async def run_evals_for_models(
    dataset_name: str,
    models: list[str],
    settings: Settings,
) -> None:
    config = AVAILABLE_DATASETS[dataset_name]
    dataset = config.create()
    runner = config.runner
    for model in models:
        print(f"\n{'=' * 60}")
        print(f"Running evals with model: {model}")
        print("=" * 60)
        experiment_name = build_experiment_name(dataset_name, model)
        await runner(
            dataset,
            model,
            experiment_name,
            settings,
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run pydantic-ai evals for the budget agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  budget-evals --dataset root_cause_multi_agent_drop_detection
  budget-evals --dataset root_cause_single_agent_drop_detection
  budget-evals --dataset native_budget_agent --model openai-responses:gpt-5.2-2025-12-11
  budget-evals --dataset sandbox_drop_detection
  budget-evals --list-datasets
        """,
    )

    parser.add_argument(
        "--dataset",
        type=str,
        choices=list(AVAILABLE_DATASETS.keys()),
        help="Name of the eval dataset to run",
    )
    parser.add_argument(
        "--model",
        type=str,
        choices=get_model_names(),
        help="Model to use (if not provided, runs on all available models)",
    )
    parser.add_argument(
        "--list-datasets",
        action="store_true",
        help="List available eval datasets",
    )

    args = parser.parse_args()

    if args.list_datasets:
        print("Available datasets:")
        for name in AVAILABLE_DATASETS:
            print(f"  - {name}")
        return

    if not args.dataset:
        parser.print_help()
        sys.exit(1)

    settings = get_settings()

    logfire.configure(
        service_name="stellaris-stats-evals",
        token=settings.logfire_token,
        console=logfire.ConsoleOptions(),
        send_to_logfire=True,
    )

    dataset_name = args.dataset
    config = AVAILABLE_DATASETS[dataset_name]

    if args.model:
        dataset = config.create()
        experiment_name = build_experiment_name(dataset_name, args.model)
        asyncio.run(
            config.runner(
                dataset,
                args.model,
                experiment_name,
                settings,
            ),
        )
    else:
        asyncio.run(
            run_evals_for_models(
                dataset_name,
                get_model_names(),
                settings,
            ),
        )


if __name__ == "__main__":
    main()
