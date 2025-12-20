from pathlib import Path
from typing import Any, cast

from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import Evaluator, IsInstance, MaxDuration

from agent.evals.evaluators.output_quality import (
    DatapointsAnalyzedCorrect,
    HasExpectedDrops,
    NoFalsePositives,
    create_summary_quality_evaluator,
)
from agent.evals.runner import EvalInputs
from agent.models import SustainedDropAnalysisResult

FIXTURES_DIR = Path(__file__).parent.parent / "fixtures" / "sustained_drops"

CaseType = Case[EvalInputs, SustainedDropAnalysisResult, dict[str, Any]]
EvaluatorType = Evaluator[EvalInputs, SustainedDropAnalysisResult, dict[str, Any]]


def create_sustained_drops_dataset() -> Dataset[
    EvalInputs, SustainedDropAnalysisResult, dict[str, Any]
]:
    energy_crisis_inputs: EvalInputs = {
        "save_filename": "test_energy_crisis",
        "fixture_path": str(FIXTURES_DIR / "energy_crisis.json"),
    }
    healthy_economy_inputs: EvalInputs = {
        "save_filename": "test_healthy",
        "fixture_path": str(FIXTURES_DIR / "healthy_economy.json"),
    }
    multiple_drops_inputs: EvalInputs = {
        "save_filename": "test_multiple_drops",
        "fixture_path": str(FIXTURES_DIR / "multiple_drops.json"),
    }

    cases: list[CaseType] = [
        Case(
            name="energy_crisis",
            inputs=energy_crisis_inputs,
            metadata={
                "description": "Save with sustained energy deficit over 4+ periods",
            },
            evaluators=(
                HasExpectedDrops(expected_resources=["energy"]),
                DatapointsAnalyzedCorrect(expected_count=6),
            ),
        ),
        Case(
            name="healthy_economy",
            inputs=healthy_economy_inputs,
            metadata={
                "description": "Save with no sustained drops - healthy economy",
            },
            evaluators=(
                NoFalsePositives(
                    healthy_resources=["energy", "minerals", "food", "alloys"],
                ),
            ),
        ),
        Case(
            name="multiple_drops",
            inputs=multiple_drops_inputs,
            metadata={
                "description": "Save with multiple resource problems",
            },
            evaluators=(
                HasExpectedDrops(
                    expected_resources=["energy", "consumerGoods"],
                ),
                create_summary_quality_evaluator(),
            ),
        ),
    ]

    global_evaluators: tuple[EvaluatorType, ...] = (
        cast(EvaluatorType, IsInstance(type_name="SustainedDropAnalysisResult")),
        cast(EvaluatorType, MaxDuration(seconds=120.0)),
    )

    return Dataset(
        name="sustained_drops_eval",
        cases=cases,
        evaluators=global_evaluators,
    )
