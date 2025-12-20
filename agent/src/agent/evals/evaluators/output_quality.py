from dataclasses import dataclass
from typing import Any, override

from pydantic_evals.evaluators import (
    EvaluationReason,
    Evaluator,
    EvaluatorContext,
    LLMJudge,
)

from agent.evals.runner import EvalInputs
from agent.models import SustainedDropAnalysisResult


@dataclass
class HasExpectedDrops(
    Evaluator[EvalInputs, SustainedDropAnalysisResult, dict[str, Any]]
):
    expected_resources: list[str]
    expected_categories: list[str] | None = None

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, SustainedDropAnalysisResult, dict[str, Any]],
    ) -> EvaluationReason:
        output = ctx.output
        detected_resources = {drop.resource for drop in output.sustained_drops}

        missing_resources = [
            r for r in self.expected_resources if r not in detected_resources
        ]
        if missing_resources:
            return EvaluationReason(
                value=False,
                reason=f"Missing expected resources: {missing_resources}. Detected: {detected_resources}",
            )

        if self.expected_categories:
            detected_categories = {
                drop.category_name for drop in output.sustained_drops
            }
            missing_categories = [
                c for c in self.expected_categories if c not in detected_categories
            ]
            if missing_categories:
                return EvaluationReason(
                    value=False,
                    reason=f"Missing expected categories: {missing_categories}. Detected: {detected_categories}",
                )

        return EvaluationReason(
            value=True,
            reason=f"All expected drops found. Resources: {self.expected_resources}",
        )


@dataclass
class NoFalsePositives(
    Evaluator[EvalInputs, SustainedDropAnalysisResult, dict[str, Any]]
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


@dataclass
class DatapointsAnalyzedCorrect(
    Evaluator[EvalInputs, SustainedDropAnalysisResult, dict[str, Any]],
):
    expected_count: int

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, SustainedDropAnalysisResult, dict[str, Any]],
    ) -> EvaluationReason:
        output = ctx.output
        actual = output.datapoints_analyzed
        if actual != self.expected_count:
            return EvaluationReason(
                value=False,
                reason=f"Expected {self.expected_count} datapoints, got {actual}",
            )

        return EvaluationReason(
            value=True,
            reason=f"Correct number of datapoints analyzed: {actual}",
        )


SUMMARY_QUALITY_RUBRIC = """
Evaluate the quality of the Stellaris budget analysis summary.

The summary should:
1. ACCURACY: Correctly describe the sustained drops found in the data
2. COMPLETENESS: Mention all detected resource problems
3. CLARITY: Be easy to understand for a Stellaris player
4. ACTIONABLE: Provide useful insights about which resources need attention

The summary should NOT:
- Include technical jargon without explanation
- Miss any significant sustained drops
- Contain factual errors about the data
- Be overly verbose or include irrelevant information

Rate the summary quality. A good summary clearly explains what resources are
problematic and for how long they have been negative.
"""


def create_summary_quality_evaluator() -> LLMJudge:
    return LLMJudge(
        rubric=SUMMARY_QUALITY_RUBRIC,
        include_input=True,
        include_expected_output=False,
    )
