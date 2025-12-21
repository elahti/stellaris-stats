import argparse
import asyncio
import sys

import logfire

from agent.evals.datasets.stable_budget_balance import (
    create_stable_budget_balance_dataset,
)
from agent.evals.runner import run_evals
from agent.settings import Settings

AVAILABLE_DATASETS = {
    "stable_budget_balance": create_stable_budget_balance_dataset,
}

AVAILABLE_MODELS = [
    "anthropic:claude-sonnet-4-5-20250929",
    "anthropic:claude-haiku-3-5-20241022",
    "anthropic:claude-opus-4-20250514",
]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run pydantic-ai evals for the budget agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  budget-evals --dataset stable_budget_balance
  budget-evals --dataset stable_budget_balance --model anthropic:claude-haiku-3-5-20241022
  budget-evals --list-datasets
  budget-evals --list-models
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
        help="Model to use (overrides default agent model)",
    )
    parser.add_argument(
        "--list-datasets",
        action="store_true",
        help="List available eval datasets",
    )
    parser.add_argument(
        "--list-models",
        action="store_true",
        help="List available models for evaluation",
    )

    args = parser.parse_args()

    if args.list_datasets:
        print("Available datasets:")
        for name in AVAILABLE_DATASETS:
            print(f"  - {name}")
        return

    if args.list_models:
        print("Available models:")
        for model in AVAILABLE_MODELS:
            print(f"  - {model}")
        return

    if not args.dataset:
        parser.print_help()
        sys.exit(1)

    settings = Settings()
    if not settings.has_api_key():
        print("Error: ANTHROPIC_API_KEY environment variable is not set.")
        sys.exit(1)

    logfire.configure(
        service_name="stellaris-stats-evals",
        token=settings.logfire_token,
        console=logfire.ConsoleOptions(),
        send_to_logfire=True,
    )

    dataset_factory = AVAILABLE_DATASETS[args.dataset]
    dataset = dataset_factory()

    model_name: str | None = args.model
    asyncio.run(run_evals(dataset, model_name=model_name))


if __name__ == "__main__":
    main()
