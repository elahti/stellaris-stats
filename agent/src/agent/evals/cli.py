import argparse
import asyncio
import sys
from collections.abc import Callable
from typing import Any

import logfire
from pydantic_evals import Dataset

from agent.budget_agent.models import SustainedDropAnalysisResult
from agent.constants import AVAILABLE_MODELS
from agent.evals.datasets.stable_budget_balance import (
    create_stable_budget_balance_dataset,
)
from agent.evals.runner import EvalInputs, run_evals
from agent.settings import Settings

DatasetFactory = Callable[
    [],
    Dataset[EvalInputs, SustainedDropAnalysisResult, dict[str, Any]],
]

AVAILABLE_DATASETS: dict[str, DatasetFactory] = {
    "stable_budget_balance": create_stable_budget_balance_dataset,
}


def build_experiment_name(dataset_name: str, model_name: str) -> str:
    model_short = model_name.split(":")[-1] if ":" in model_name else model_name
    return f"{dataset_name}_{model_short}"


async def run_evals_for_models(
    dataset_factory: DatasetFactory,
    dataset_name: str,
    models: list[str],
) -> None:
    dataset = dataset_factory()
    for model in models:
        print(f"\n{'=' * 60}")
        print(f"Running evals with model: {model}")
        print("=" * 60)
        experiment_name = build_experiment_name(dataset_name, model)
        await run_evals(dataset, model_name=model, experiment_name=experiment_name)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run pydantic-ai evals for the budget agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  budget-evals --dataset stable_budget_balance
  budget-evals --dataset stable_budget_balance --model openai:gpt-5.2-2025-12-11
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

    settings = Settings()

    logfire.configure(
        service_name="stellaris-stats-evals",
        token=settings.logfire_token,
        console=logfire.ConsoleOptions(),
        send_to_logfire=True,
    )

    dataset_factory = AVAILABLE_DATASETS[args.dataset]
    dataset_name = args.dataset

    if args.model:
        dataset = dataset_factory()
        experiment_name = build_experiment_name(dataset_name, args.model)
        asyncio.run(
            run_evals(
                dataset,
                model_name=args.model,
                experiment_name=experiment_name,
            ),
        )
    else:
        asyncio.run(
            run_evals_for_models(
                dataset_factory,
                dataset_name,
                AVAILABLE_MODELS,
            ),
        )


if __name__ == "__main__":
    main()
