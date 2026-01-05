from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import IsInstance

from agent.evals.evaluators.neighbor_quality import (
    HasFindingType,
    HostileNeighborDetected,
    NeighborCount,
    NeighborDistanceOrder,
    NeighborOpinionRange,
    NeighborThreatRange,
    NoFindingType,
)
from agent.evals.types import EvalInputs, EvalMetadata
from agent.neighbor import FindingSeverity, NeighborAnalysisResult

CaseType = Case[EvalInputs, NeighborAnalysisResult, EvalMetadata]


def create_neighbor_dataset() -> Dataset[
    EvalInputs,
    NeighborAnalysisResult,
    EvalMetadata,
]:
    basic_detection_inputs: EvalInputs = {
        "save_filename": "commonwealthofman_1251622081",
        "fixture_path": "neighbor_analysis/basic_detection.sql",
    }

    hostile_neighbor_inputs: EvalInputs = {
        "save_filename": "commonwealthofman_1251622081",
        "fixture_path": "neighbor_analysis/hostile_neighbor.sql",
    }

    low_opinion_inputs: EvalInputs = {
        "save_filename": "commonwealthofman_1251622081",
        "fixture_path": "neighbor_analysis/low_opinion.sql",
    }

    high_threat_inputs: EvalInputs = {
        "save_filename": "commonwealthofman_1251622081",
        "fixture_path": "neighbor_analysis/high_threat.sql",
    }

    genocidal_reputation_inputs: EvalInputs = {
        "save_filename": "commonwealthofman_1251622081",
        "fixture_path": "neighbor_analysis/genocidal_reputation.sql",
    }

    cases: list[CaseType] = [
        Case(
            name="basic_neighbor_detection",
            inputs=basic_detection_inputs,
            metadata={
                "description": "Basic scenario with multiple neighbors at different distances",
            },
            evaluators=(
                NeighborCount(min_count=1),
                NeighborDistanceOrder(),
                NoFindingType(finding_type="hostile_neighbor"),
            ),
        ),
        Case(
            name="hostile_neighbor",
            inputs=hostile_neighbor_inputs,
            metadata={
                "description": "Scenario with a hostile neighbor marked as is_hostile=true",
            },
            evaluators=(
                NeighborDistanceOrder(),
                HostileNeighborDetected(),
                HasFindingType(
                    finding_type="hostile_neighbor",
                    severity=FindingSeverity.CRITICAL,
                ),
            ),
        ),
        Case(
            name="low_opinion_neighbor",
            inputs=low_opinion_inputs,
            metadata={
                "description": "Scenario with a neighbor having opinion below -50",
            },
            evaluators=(
                NeighborDistanceOrder(),
                NeighborOpinionRange(max_opinion=-50.0),
                HasFindingType(
                    finding_type="low_opinion",
                    severity=FindingSeverity.WARNING,
                ),
            ),
        ),
        Case(
            name="high_threat_neighbor",
            inputs=high_threat_inputs,
            metadata={
                "description": "Scenario with a neighbor having threat above 50",
            },
            evaluators=(
                NeighborDistanceOrder(),
                NeighborThreatRange(min_threat=50.0),
                HasFindingType(
                    finding_type="high_threat",
                    severity=FindingSeverity.INFO,
                ),
            ),
        ),
        Case(
            name="genocidal_reputation",
            inputs=genocidal_reputation_inputs,
            metadata={
                "description": "Scenario with genocidal opinion modifier present",
            },
            evaluators=(
                NeighborDistanceOrder(),
                HasFindingType(
                    finding_type="genocidal_reputation",
                    severity=FindingSeverity.WARNING,
                ),
            ),
        ),
    ]

    global_evaluators = (IsInstance(type_name="NeighborAnalysisResult"),)

    return Dataset(
        name="neighbor_analysis",
        cases=cases,
        evaluators=global_evaluators,
    )
