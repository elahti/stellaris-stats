from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import IsInstance

from agent.evals.evaluators.output_quality import (
    NoResourceDrop,
    ResourceDrop,
)
from agent.evals.types import EvalInputs, EvalMetadata
from agent.models import SuddenDropAnalysisResult

CaseType = Case[EvalInputs, SuddenDropAnalysisResult, EvalMetadata]


def create_sandbox_drop_detection_dataset() -> Dataset[
    EvalInputs,
    SuddenDropAnalysisResult,
    EvalMetadata,
]:
    trade_drop_inputs: EvalInputs = {
        "save_filename": "commonwealthofman_1251622081",
        "fixture_path": "sudden_drop_detection/trade_drop_only.sql",
    }

    energy_and_alloys_drop_inputs: EvalInputs = {
        "save_filename": "commonwealthofman_1251622081",
        "fixture_path": "sudden_drop_detection/energy_and_alloys_drop.sql",
    }

    cases: list[CaseType] = [
        Case(
            name="trade_drop_only",
            inputs=trade_drop_inputs,
            metadata={
                "description": "Dataset with 100% trade drop, all other resources stable",
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
        Case(
            name="energy_and_alloys_drop",
            inputs=energy_and_alloys_drop_inputs,
            metadata={
                "description": "Dataset with 30%+ drops in energy and alloys",
            },
            evaluators=(
                ResourceDrop(resource="alloys", min_drop_percent=30.0),
                NoResourceDrop(resource="astralThreads"),
                NoResourceDrop(resource="consumerGoods"),
                ResourceDrop(resource="energy", min_drop_percent=30.0),
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
                NoResourceDrop(resource="trade"),
            ),
        ),
    ]

    global_evaluators = (IsInstance(type_name="SuddenDropAnalysisResult"),)

    return Dataset(
        name="sandbox_drop_detection",
        cases=cases,
        evaluators=global_evaluators,
    )
