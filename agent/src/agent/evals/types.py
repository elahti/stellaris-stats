from collections.abc import Awaitable, Callable
from typing import TypedDict

from agent.models import MultiAgentAnalysisResult, SuddenDropAnalysisResult
from agent.neighbor import NeighborAnalysisResult


class EvalInputs(TypedDict):
    """Inputs for evaluation cases containing save file and fixture information."""

    save_filename: str
    fixture_path: str


class EvalMetadata(TypedDict):
    """Metadata for evaluation cases."""

    description: str


EvalTask = Callable[[EvalInputs], Awaitable[MultiAgentAnalysisResult]]
LegacyEvalTask = Callable[[EvalInputs], Awaitable[SuddenDropAnalysisResult]]
NeighborEvalTask = Callable[[EvalInputs], Awaitable[NeighborAnalysisResult]]
