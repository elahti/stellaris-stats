from dataclasses import dataclass
from typing import Any, override

from pydantic_evals.evaluators import (
    EvaluationReason,
    Evaluator,
    EvaluatorContext,
)

from agent.budget_agent.models import SuddenDropAnalysisResult


@dataclass
class NoResourceDrop(
    Evaluator[Any, SuddenDropAnalysisResult, dict[str, Any]],
):
    resource: str

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[Any, SuddenDropAnalysisResult, dict[str, Any]],
    ) -> EvaluationReason:
        output = ctx.output
        drops = [drop for drop in output.sudden_drops if drop.resource == self.resource]

        if drops:
            drop = drops[0]
            return EvaluationReason(
                value=False,
                reason=f"{self.resource} drop detected: {drop.drop_percent:.1f}% from {drop.start_value:.2f} to {drop.end_value:.2f}",
            )

        return EvaluationReason(
            value=True,
            reason=f"No {self.resource} drops detected",
        )


@dataclass
class ResourceDrop(
    Evaluator[Any, SuddenDropAnalysisResult, dict[str, Any]],
):
    resource: str
    min_drop_percent: float

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[Any, SuddenDropAnalysisResult, dict[str, Any]],
    ) -> EvaluationReason:
        output = ctx.output
        drops = [drop for drop in output.sudden_drops if drop.resource == self.resource]

        if not drops:
            return EvaluationReason(
                value=False,
                reason=f"No {self.resource} drop detected, expected drop >= {self.min_drop_percent:.1f}%",
            )

        qualifying_drops = [d for d in drops if d.drop_percent >= self.min_drop_percent]
        if qualifying_drops:
            max_drop = max(qualifying_drops, key=lambda d: d.drop_percent)
            return EvaluationReason(
                value=True,
                reason=f"{self.resource} drop detected: {max_drop.drop_percent:.1f}% (>= {self.min_drop_percent:.1f}%)",
            )

        max_drop = max(drops, key=lambda d: d.drop_percent)
        return EvaluationReason(
            value=False,
            reason=f"{self.resource} max drop {max_drop.drop_percent:.1f}% is below expected {self.min_drop_percent:.1f}%",
        )
