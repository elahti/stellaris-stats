import argparse
import asyncio
import sys
from collections.abc import AsyncIterator, Callable, Coroutine
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Any

import logfire
from pydantic_evals import Dataset

from agent.constants import get_model_names
from agent.evals.datasets.native_budget import (
    create_native_budget_dataset,
)
from agent.evals.datasets.neighbor import (
    create_neighbor_dataset,
)
from agent.evals.datasets.root_cause import (
    create_root_cause_dataset,
)
from agent.evals.datasets.sandbox import (
    create_sandbox_dataset,
)
from agent.evals.native_budget_runner import run_native_budget_evals
from agent.evals.neighbor_multi_runner import run_neighbor_multi_evals
from agent.evals.neighbor_single_runner import run_neighbor_single_evals
from agent.evals.root_cause_multi_runner import run_root_cause_multi_evals
from agent.evals.root_cause_single_runner import run_root_cause_single_evals
from agent.evals.sandbox_runner import run_sandbox_evals
from agent.evals.test_database import destroy_test_template
from agent.settings import Settings, get_settings


@asynccontextmanager
async def eval_session(settings: Settings) -> AsyncIterator[None]:
    """Context manager for eval session - ensures template cleanup."""
    try:
        yield
    finally:
        await destroy_test_template(settings)


@dataclass
class DatasetConfig:
    create: Callable[[], Dataset[Any, Any, Any]]
    runner: Callable[..., Coroutine[Any, Any, Any]]


AVAILABLE_DATASETS: dict[str, DatasetConfig] = {
    "root_cause_multi": DatasetConfig(
        create=create_root_cause_dataset,
        runner=run_root_cause_multi_evals,
    ),
    "root_cause_single": DatasetConfig(
        create=create_root_cause_dataset,
        runner=run_root_cause_single_evals,
    ),
    "native_budget": DatasetConfig(
        create=create_native_budget_dataset,
        runner=run_native_budget_evals,
    ),
    "sandbox": DatasetConfig(
        create=create_sandbox_dataset,
        runner=run_sandbox_evals,
    ),
    "neighbor_multi": DatasetConfig(
        create=create_neighbor_dataset,
        runner=run_neighbor_multi_evals,
    ),
    "neighbor_single": DatasetConfig(
        create=create_neighbor_dataset,
        runner=run_neighbor_single_evals,
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
    dataset: Any,
    models: list[str],
    settings: Settings,
) -> None:
    async with eval_session(settings):
        config = AVAILABLE_DATASETS[dataset_name]
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
        description="Run pydantic-ai evals for budget and neighbor agents",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  budget-evals --dataset root_cause_multi
  budget-evals --dataset root_cause_single
  budget-evals --dataset native_budget --model openai-responses:gpt-5.2-2025-12-11
  budget-evals --dataset sandbox
  budget-evals --dataset neighbor_multi
  budget-evals --dataset neighbor_single
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
    parser.add_argument(
        "--case",
        type=str,
        help="Run only the specified case (by name)",
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
    dataset = config.create()

    if args.case:
        original_count = len(dataset.cases)
        dataset.cases = [c for c in dataset.cases if c.name == args.case]
        if not dataset.cases:
            print(f"Error: Case '{args.case}' not found in dataset '{dataset_name}'")
            print(f"Available cases: {[c.name for c in config.create().cases]}")
            sys.exit(1)
        print(f"Filtered to case '{args.case}' (1 of {original_count} cases)")

    if args.model:
        experiment_name = build_experiment_name(dataset_name, args.model)

        async def run_single() -> None:
            async with eval_session(settings):
                await config.runner(
                    dataset,
                    args.model,
                    experiment_name,
                    settings,
                )

        asyncio.run(run_single())
    else:
        asyncio.run(
            run_evals_for_models(
                dataset_name,
                dataset,
                get_model_names(),
                settings,
            ),
        )


if __name__ == "__main__":
    main()
