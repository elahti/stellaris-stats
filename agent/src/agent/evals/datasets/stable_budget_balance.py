from pathlib import Path
from typing import Any, cast

from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import Evaluator, IsInstance, MaxDuration

from agent.budget_agent.models import SuddenDropAnalysisResult
from agent.evals.evaluators.output_quality import NoResourceDrop, ResourceDrop
from agent.evals.runner import EvalInputs

FIXTURES_DIR = Path(__file__).parent.parent / "fixtures" / "stable_budget_balance"

CaseType = Case[EvalInputs, SuddenDropAnalysisResult, dict[str, Any]]
EvaluatorType = Evaluator[EvalInputs, SuddenDropAnalysisResult, dict[str, Any]]


def create_stable_budget_balance_dataset() -> Dataset[
    EvalInputs,
    SuddenDropAnalysisResult,
    dict[str, Any],
]:
    stable_energy_inputs: EvalInputs = {
        "save_filename": "commonwealthofman_1251622081",
        "fixture_path": str(FIXTURES_DIR / "stable_energy_balance.json"),
    }

    cases: list[CaseType] = [
        Case(
            name="stable_energy_balance",
            inputs=stable_energy_inputs,
            metadata={
                "description": "Stable energy balance dataset with no sudden drops",
            },
            evaluators=(
                NoResourceDrop(resource="alloys"),
                NoResourceDrop(resource="astralThreads"),
                NoResourceDrop(resource="consumerGoods"),
                NoResourceDrop(resource="energy"),
                NoResourceDrop(resource="engineeringResearch"),
                NoResourceDrop(resource="exoticGases"),
                NoResourceDrop(resource="food"),
                NoResourceDrop(resource="influence"),
                NoResourceDrop(resource="minerals"),
                NoResourceDrop(resource="minorArtifacts"),
                NoResourceDrop(resource="nanites"),
                NoResourceDrop(resource="physicsResearch"),
                NoResourceDrop(resource="rareCrystals"),
                NoResourceDrop(resource="societyResearch"),
                NoResourceDrop(resource="srDarkMatter"),
                NoResourceDrop(resource="srLivingMetal"),
                NoResourceDrop(resource="srZro"),
                NoResourceDrop(resource="unity"),
                NoResourceDrop(resource="volatileMotes"),
                ResourceDrop(resource="trade", min_drop_percent=100.0),
            ),
        ),
    ]

    global_evaluators: tuple[EvaluatorType, ...] = (
        cast(EvaluatorType, IsInstance(type_name="SuddenDropAnalysisResult")),
        cast(EvaluatorType, MaxDuration(seconds=120.0)),
    )

    return Dataset(
        name="stable_budget_balance_eval",
        cases=cases,
        evaluators=global_evaluators,
    )
