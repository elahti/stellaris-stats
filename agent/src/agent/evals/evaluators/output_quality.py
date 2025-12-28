from dataclasses import dataclass
from typing import Any, override

from pydantic_evals.evaluators import (
    EvaluationReason,
    Evaluator,
    EvaluatorContext,
)

from agent.evals.types import EvalInputs, EvalMetadata
from agent.models import (
    ContributorType,
    MultiAgentAnalysisResult,
    RootCauseAnalysisResult,
    SuddenDrop,
    SuddenDropAnalysisResult,
    SuddenDropWithRootCause,
)


def _extract_drops(
    output: MultiAgentAnalysisResult | SuddenDropAnalysisResult,
) -> list[SuddenDrop]:
    """Extract SuddenDrop objects from either analysis result type."""
    if isinstance(output, MultiAgentAnalysisResult):
        return [dwc.drop for dwc in output.drops_with_root_causes]
    return output.sudden_drops


def _find_drop_with_root_cause(
    output: MultiAgentAnalysisResult,
    resource: str,
) -> SuddenDropWithRootCause | None:
    """Find the SuddenDropWithRootCause entry for a specific resource."""
    for dwc in output.drops_with_root_causes:
        if dwc.drop.resource == resource:
            return dwc
    return None


def _get_root_cause(
    output: MultiAgentAnalysisResult,
    resource: str,
) -> RootCauseAnalysisResult | None:
    """Get the root cause analysis for a specific resource, if it exists."""
    dwc = _find_drop_with_root_cause(output, resource)
    return dwc.root_cause if dwc else None


@dataclass
class NoResourceDrop(
    Evaluator[EvalInputs, Any, EvalMetadata],
):
    """Evaluator that asserts a specific resource has no sudden drops."""

    resource: str

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, Any, EvalMetadata],
    ) -> EvaluationReason:
        output = ctx.output
        all_drops = _extract_drops(output)
        drops = [drop for drop in all_drops if drop.resource == self.resource]

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
    Evaluator[EvalInputs, Any, EvalMetadata],
):
    """Evaluator that asserts a specific resource has a drop meeting the minimum threshold."""

    resource: str
    min_drop_percent: float

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, Any, EvalMetadata],
    ) -> EvaluationReason:
        output = ctx.output
        all_drops = _extract_drops(output)
        drops = [drop for drop in all_drops if drop.resource == self.resource]

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


@dataclass
class RootCauseAnalyzed(
    Evaluator[EvalInputs, Any, EvalMetadata],
):
    """Evaluator that asserts root cause analysis succeeded for a resource drop."""

    resource: str

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, Any, EvalMetadata],
    ) -> EvaluationReason:
        output = ctx.output
        dwc = _find_drop_with_root_cause(output, self.resource)

        if dwc is None:
            return EvaluationReason(
                value=False,
                reason=f"No drop found for {self.resource}, cannot verify root cause",
            )

        if dwc.analysis_error:
            return EvaluationReason(
                value=False,
                reason=f"Root cause analysis failed for {self.resource}: {dwc.analysis_error}",
            )

        if dwc.root_cause is None:
            return EvaluationReason(
                value=False,
                reason=f"Root cause is None for {self.resource} drop",
            )

        return EvaluationReason(
            value=True,
            reason=f"Root cause analyzed for {self.resource}: {len(dwc.root_cause.top_contributors)} contributors identified",
        )


@dataclass
class HasTopContributor(
    Evaluator[EvalInputs, Any, EvalMetadata],
):
    """Evaluator that asserts a category appears in top contributors for a resource's root cause."""

    resource: str
    category: str
    contributor_type: ContributorType | None = None

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, Any, EvalMetadata],
    ) -> EvaluationReason:
        output = ctx.output
        root_cause = _get_root_cause(output, self.resource)

        if root_cause is None:
            return EvaluationReason(
                value=False,
                reason=f"No root cause found for {self.resource}",
            )

        matching_contributors = [
            c for c in root_cause.top_contributors if c.category == self.category
        ]

        if not matching_contributors:
            categories = [c.category for c in root_cause.top_contributors]
            return EvaluationReason(
                value=False,
                reason=f"Category '{self.category}' not in top contributors for {self.resource}. Found: {categories}",
            )

        contributor = matching_contributors[0]

        if (
            self.contributor_type
            and contributor.contributor_type != self.contributor_type
        ):
            return EvaluationReason(
                value=False,
                reason=f"Category '{self.category}' has type '{contributor.contributor_type}', expected '{self.contributor_type}'",
            )

        type_info = (
            f" ({contributor.contributor_type})" if self.contributor_type else ""
        )
        return EvaluationReason(
            value=True,
            reason=f"Category '{self.category}' found in top contributors for {self.resource}{type_info}",
        )


@dataclass
class NoRootCause(
    Evaluator[EvalInputs, Any, EvalMetadata],
):
    """Evaluator that asserts no root cause exists for a resource (no drop detected)."""

    resource: str

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, Any, EvalMetadata],
    ) -> EvaluationReason:
        output = ctx.output
        dwc = _find_drop_with_root_cause(output, self.resource)

        if dwc is not None:
            return EvaluationReason(
                value=False,
                reason=f"Root cause entry found for {self.resource}, expected none",
            )

        return EvaluationReason(
            value=True,
            reason=f"No root cause entry for {self.resource} as expected",
        )
