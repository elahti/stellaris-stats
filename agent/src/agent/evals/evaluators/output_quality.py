from dataclasses import dataclass
from typing import Any, override

from pydantic_evals.evaluators import (
    EvaluationReason,
    Evaluator,
    EvaluatorContext,
)

from agent.budget_agent.models import SuddenDropAnalysisResult
from agent.evals.runner import EvalInputs


@dataclass
class NoResourceDrop(
    Evaluator[EvalInputs, SuddenDropAnalysisResult, dict[str, Any]],
):
    resource: str

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, SuddenDropAnalysisResult, dict[str, Any]],
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
