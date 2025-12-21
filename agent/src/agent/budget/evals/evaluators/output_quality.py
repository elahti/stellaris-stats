from dataclasses import dataclass
from typing import Any, override

from pydantic_evals.evaluators import (
    EvaluationReason,
    Evaluator,
    EvaluatorContext,
)

from agent.budget.evals.runner import EvalInputs
from agent.budget.models import SustainedDropAnalysisResult


@dataclass
class NoFalsePositives(
    Evaluator[EvalInputs, SustainedDropAnalysisResult, dict[str, Any]],
):
    healthy_resources: list[str]

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, SustainedDropAnalysisResult, dict[str, Any]],
    ) -> EvaluationReason:
        output = ctx.output
        detected_resources = {drop.resource for drop in output.sustained_drops}

        false_positives = [r for r in self.healthy_resources if r in detected_resources]
        if false_positives:
            return EvaluationReason(
                value=False,
                reason=f"False positives detected for healthy resources: {false_positives}",
            )

        return EvaluationReason(
            value=True,
            reason=f"No false positives. Healthy resources correctly not flagged: {self.healthy_resources}",
        )
