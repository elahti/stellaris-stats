import argparse
import asyncio
import sys
from collections.abc import Callable
from typing import Any

import logfire
from pydantic_evals import Dataset

from agent.budget_agent.models import SuddenDropAnalysisResult
from agent.constants import AVAILABLE_MODELS
from agent.evals.datasets.sandbox_sudden_drop_detection import (
    create_sandbox_sudden_drop_detection_dataset,
)
from agent.evals.datasets.sudden_drop_detection import (
    create_sudden_drop_detection_dataset,
)
from agent.evals.runner import EvalInputs, run_evals
from agent.evals.sandbox_runner import (
    SandboxEvalInputs,
    run_sandbox_evals,
)
from agent.settings import Settings

DatasetFactory = Callable[
    [],
    Dataset[EvalInputs, SuddenDropAnalysisResult, dict[str, Any]],
]

SandboxDatasetFactory = Callable[
    [],
    Dataset[SandboxEvalInputs, SuddenDropAnalysisResult, dict[str, Any]],
]

AVAILABLE_DATASETS: dict[str, DatasetFactory] = {
    "sudden_drop_detection": create_sudden_drop_detection_dataset,
}

SANDBOX_DATASETS: dict[str, SandboxDatasetFactory] = {
    "sandbox_sudden_drop_detection": create_sandbox_sudden_drop_detection_dataset,
}


def build_experiment_name(dataset_name: str, model_name: str) -> str:
    model_short = model_name.split(":")[-1] if ":" in model_name else model_name
    return f"{dataset_name}_{model_short}"


async def run_evals_for_models(
    dataset_factory: DatasetFactory,
    dataset_name: str,
    models: list[str],
    settings: Settings,
) -> None:
    dataset = dataset_factory()
    for model in models:
        print(f"\n{'=' * 60}")
        print(f"Running evals with model: {model}")
        print("=" * 60)
        experiment_name = build_experiment_name(dataset_name, model)
        await run_evals(
            dataset,
            model_name=model,
            experiment_name=experiment_name,
            settings=settings,
        )


async def run_sandbox_evals_for_models(
    dataset_factory: SandboxDatasetFactory,
    dataset_name: str,
    models: list[str],
    settings: Settings,
) -> None:
    dataset = dataset_factory()
    for model in models:
        print(f"\n{'=' * 60}")
        print(f"Running sandbox evals with model: {model}")
        print("=" * 60)
        experiment_name = build_experiment_name(dataset_name, model)
        await run_sandbox_evals(
            dataset,
            model_name=model,
            experiment_name=experiment_name,
            settings=settings,
        )


def main() -> None:
    all_datasets = list(AVAILABLE_DATASETS.keys()) + list(SANDBOX_DATASETS.keys())

    parser = argparse.ArgumentParser(
        description="Run pydantic-ai evals for the budget agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  budget-evals --dataset sudden_drop_detection
  budget-evals --dataset sandbox_sudden_drop_detection
  budget-evals --dataset sudden_drop_detection --model openai:gpt-5.2-2025-12-11
  budget-evals --list-datasets
        """,
    )

    parser.add_argument(
        "--dataset",
        type=str,
        choices=all_datasets,
        help="Name of the eval dataset to run",
    )
    parser.add_argument(
        "--model",
        type=str,
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
        print("\nSandbox datasets:")
        for name in SANDBOX_DATASETS:
            print(f"  - {name}")
        return

    if not args.dataset:
        parser.print_help()
        sys.exit(1)

    settings = Settings()

    logfire.configure(
        service_name="stellaris-stats-evals",
        token=settings.logfire_token,
        console=logfire.ConsoleOptions(),
        send_to_logfire=True,
    )

    dataset_name = args.dataset
    is_sandbox = dataset_name in SANDBOX_DATASETS

    if is_sandbox:
        sandbox_factory = SANDBOX_DATASETS[dataset_name]
        if args.model:
            dataset = sandbox_factory()
            experiment_name = build_experiment_name(dataset_name, args.model)
            asyncio.run(
                run_sandbox_evals(
                    dataset,
                    model_name=args.model,
                    experiment_name=experiment_name,
                    settings=settings,
                ),
            )
        else:
            asyncio.run(
                run_sandbox_evals_for_models(
                    sandbox_factory,
                    dataset_name,
                    AVAILABLE_MODELS,
                    settings,
                ),
            )
    else:
        dataset_factory = AVAILABLE_DATASETS[dataset_name]
        if args.model:
            dataset = dataset_factory()
            experiment_name = build_experiment_name(dataset_name, args.model)
            asyncio.run(
                run_evals(
                    dataset,
                    model_name=args.model,
                    experiment_name=experiment_name,
                    settings=settings,
                ),
            )
        else:
            asyncio.run(
                run_evals_for_models(
                    dataset_factory,
                    dataset_name,
                    AVAILABLE_MODELS,
                    settings,
                ),
            )


if __name__ == "__main__":
    main()
