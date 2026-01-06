from dataclasses import dataclass
from typing import Any, override

from pydantic_evals.evaluators import (
    EvaluationReason,
    Evaluator,
    EvaluatorContext,
)

from agent.evals.types import EvalInputs, EvalMetadata
from agent.neighbor import (
    FindingSeverity,
    NeighborAnalysisResult,
    NeighborInfo,
)


def _find_neighbor(
    output: NeighborAnalysisResult,
    country_id: str | None = None,
    neighbor_name: str | None = None,
) -> NeighborInfo | None:
    for neighbor in output.neighbors:
        if country_id is not None and neighbor.country_id == country_id:
            return neighbor
        if neighbor_name is not None and neighbor.name == neighbor_name:
            return neighbor
    return None


@dataclass
class NeighborDetected(
    Evaluator[EvalInputs, Any, EvalMetadata],
):
    """Evaluator that asserts a specific neighbor is detected by country_id or name."""

    country_id: str | None = None
    neighbor_name: str | None = None

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, Any, EvalMetadata],
    ) -> EvaluationReason:
        output = ctx.output
        neighbor = _find_neighbor(output, self.country_id, self.neighbor_name)

        if neighbor:
            return EvaluationReason(
                value=True,
                reason=f"Neighbor '{neighbor.name}' (country_id={neighbor.country_id}) detected at distance {neighbor.min_distance:.1f}",
            )

        identifier = self.country_id or self.neighbor_name
        return EvaluationReason(
            value=False,
            reason=f"Expected neighbor not found: {identifier}",
        )


@dataclass
class NeighborCount(
    Evaluator[EvalInputs, Any, EvalMetadata],
):
    """Evaluator that asserts the number of neighbors detected."""

    min_count: int | None = None
    max_count: int | None = None
    exact_count: int | None = None

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, Any, EvalMetadata],
    ) -> EvaluationReason:
        actual = len(ctx.output.neighbors)

        if self.exact_count is not None:
            if actual == self.exact_count:
                return EvaluationReason(
                    value=True,
                    reason=f"Detected {actual} neighbors as expected",
                )
            return EvaluationReason(
                value=False,
                reason=f"Expected {self.exact_count} neighbors, got {actual}",
            )

        if self.min_count is not None and actual < self.min_count:
            return EvaluationReason(
                value=False,
                reason=f"Expected at least {self.min_count} neighbors, got {actual}",
            )

        if self.max_count is not None and actual > self.max_count:
            return EvaluationReason(
                value=False,
                reason=f"Expected at most {self.max_count} neighbors, got {actual}",
            )

        constraint: list[str] = []
        if self.min_count is not None:
            constraint.append(f">= {self.min_count}")
        if self.max_count is not None:
            constraint.append(f"<= {self.max_count}")
        constraint_str = " and ".join(constraint) if constraint else "any"

        return EvaluationReason(
            value=True,
            reason=f"Detected {actual} neighbors ({constraint_str})",
        )


@dataclass
class NeighborDistanceOrder(
    Evaluator[EvalInputs, Any, EvalMetadata],
):
    """Evaluator that asserts neighbors are sorted by distance ascending."""

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, Any, EvalMetadata],
    ) -> EvaluationReason:
        neighbors = ctx.output.neighbors
        if len(neighbors) <= 1:
            return EvaluationReason(
                value=True,
                reason="Single or no neighbors, order is trivially correct",
            )

        for i in range(len(neighbors) - 1):
            if neighbors[i].min_distance > neighbors[i + 1].min_distance:
                return EvaluationReason(
                    value=False,
                    reason=(
                        f"Neighbor '{neighbors[i].name}' (distance={neighbors[i].min_distance:.1f}) "
                        f"should come after '{neighbors[i + 1].name}' (distance={neighbors[i + 1].min_distance:.1f})"
                    ),
                )

        return EvaluationReason(
            value=True,
            reason="Neighbors correctly sorted by distance",
        )


@dataclass
class HasFindingType(
    Evaluator[EvalInputs, Any, EvalMetadata],
):
    """Evaluator that asserts a specific finding type is present."""

    finding_type: str
    severity: FindingSeverity | None = None

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, Any, EvalMetadata],
    ) -> EvaluationReason:
        for finding in ctx.output.key_findings:
            if finding.finding_type == self.finding_type:
                if self.severity and finding.severity != self.severity:
                    return EvaluationReason(
                        value=False,
                        reason=f"Finding '{self.finding_type}' has severity '{finding.severity}', expected '{self.severity}'",
                    )
                return EvaluationReason(
                    value=True,
                    reason=f"Finding '{self.finding_type}' detected with severity '{finding.severity}'",
                )

        return EvaluationReason(
            value=False,
            reason=f"Finding type '{self.finding_type}' not detected",
        )


@dataclass
class NoFindingType(
    Evaluator[EvalInputs, Any, EvalMetadata],
):
    """Evaluator that asserts a specific finding type is NOT present."""

    finding_type: str

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, Any, EvalMetadata],
    ) -> EvaluationReason:
        for finding in ctx.output.key_findings:
            if finding.finding_type == self.finding_type:
                return EvaluationReason(
                    value=False,
                    reason=f"Unexpected finding type '{self.finding_type}' detected: {finding.description}",
                )

        return EvaluationReason(
            value=True,
            reason=f"No '{self.finding_type}' finding detected as expected",
        )


@dataclass
class HostileNeighborDetected(
    Evaluator[EvalInputs, Any, EvalMetadata],
):
    """Evaluator that asserts a hostile neighbor is correctly identified."""

    country_id: str | None = None
    neighbor_name: str | None = None

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, Any, EvalMetadata],
    ) -> EvaluationReason:
        output = ctx.output

        if self.country_id is None and self.neighbor_name is None:
            for neighbor in output.neighbors:
                if neighbor.is_hostile:
                    return EvaluationReason(
                        value=True,
                        reason=f"Hostile neighbor '{neighbor.name}' detected",
                    )
            return EvaluationReason(
                value=False,
                reason="No hostile neighbor detected",
            )

        neighbor = _find_neighbor(output, self.country_id, self.neighbor_name)
        if neighbor is None:
            identifier = self.country_id or self.neighbor_name
            return EvaluationReason(
                value=False,
                reason=f"Neighbor '{identifier}' not found",
            )

        if neighbor.is_hostile:
            return EvaluationReason(
                value=True,
                reason=f"Hostile neighbor '{neighbor.name}' correctly identified",
            )

        return EvaluationReason(
            value=False,
            reason=f"Neighbor '{neighbor.name}' exists but is_hostile={neighbor.is_hostile}",
        )


@dataclass
class NeighborOpinionRange(
    Evaluator[EvalInputs, Any, EvalMetadata],
):
    """Evaluator that asserts a neighbor's opinion is within expected range.

    If country_id or neighbor_name is specified, checks that specific neighbor.
    If neither is specified, checks if ANY neighbor matches the criteria.
    """

    country_id: str | None = None
    neighbor_name: str | None = None
    min_opinion: float | None = None
    max_opinion: float | None = None

    def _check_opinion_range(self, neighbor: NeighborInfo) -> bool:
        if neighbor.opinion is None:
            return False
        if self.min_opinion is not None and neighbor.opinion < self.min_opinion:
            return False
        return not (
            self.max_opinion is not None and neighbor.opinion > self.max_opinion
        )

    def _constraint_str(self) -> str:
        constraint: list[str] = []
        if self.min_opinion is not None:
            constraint.append(f">= {self.min_opinion:.1f}")
        if self.max_opinion is not None:
            constraint.append(f"<= {self.max_opinion:.1f}")
        return " and ".join(constraint) if constraint else "any"

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, Any, EvalMetadata],
    ) -> EvaluationReason:
        output = ctx.output

        if self.country_id is None and self.neighbor_name is None:
            for neighbor in output.neighbors:
                if self._check_opinion_range(neighbor):
                    return EvaluationReason(
                        value=True,
                        reason=f"Neighbor '{neighbor.name}' opinion {neighbor.opinion:.1f} within range ({self._constraint_str()})",
                    )
            return EvaluationReason(
                value=False,
                reason=f"No neighbor found with opinion in range ({self._constraint_str()})",
            )

        neighbor = _find_neighbor(output, self.country_id, self.neighbor_name)

        if neighbor is None:
            identifier = self.country_id or self.neighbor_name
            return EvaluationReason(
                value=False,
                reason=f"Neighbor '{identifier}' not found",
            )

        if neighbor.opinion is None:
            return EvaluationReason(
                value=False,
                reason=f"Neighbor '{neighbor.name}' has no opinion value",
            )

        if not self._check_opinion_range(neighbor):
            if self.min_opinion is not None and neighbor.opinion < self.min_opinion:
                return EvaluationReason(
                    value=False,
                    reason=f"Neighbor '{neighbor.name}' opinion {neighbor.opinion:.1f} is below minimum {self.min_opinion:.1f}",
                )
            return EvaluationReason(
                value=False,
                reason=f"Neighbor '{neighbor.name}' opinion {neighbor.opinion:.1f} exceeds maximum {self.max_opinion:.1f}",
            )

        return EvaluationReason(
            value=True,
            reason=f"Neighbor '{neighbor.name}' opinion {neighbor.opinion:.1f} within range ({self._constraint_str()})",
        )


@dataclass
class NeighborThreatRange(
    Evaluator[EvalInputs, Any, EvalMetadata],
):
    """Evaluator that asserts a neighbor's threat level is within expected range.

    If country_id or neighbor_name is specified, checks that specific neighbor.
    If neither is specified, checks if ANY neighbor matches the criteria.
    """

    country_id: str | None = None
    neighbor_name: str | None = None
    min_threat: float | None = None
    max_threat: float | None = None

    def _check_threat_range(self, neighbor: NeighborInfo) -> bool:
        if neighbor.threat is None:
            return False
        if self.min_threat is not None and neighbor.threat < self.min_threat:
            return False
        return not (self.max_threat is not None and neighbor.threat > self.max_threat)

    def _constraint_str(self) -> str:
        constraint: list[str] = []
        if self.min_threat is not None:
            constraint.append(f">= {self.min_threat:.1f}")
        if self.max_threat is not None:
            constraint.append(f"<= {self.max_threat:.1f}")
        return " and ".join(constraint) if constraint else "any"

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, Any, EvalMetadata],
    ) -> EvaluationReason:
        output = ctx.output

        if self.country_id is None and self.neighbor_name is None:
            for neighbor in output.neighbors:
                if self._check_threat_range(neighbor):
                    return EvaluationReason(
                        value=True,
                        reason=f"Neighbor '{neighbor.name}' threat {neighbor.threat:.1f} within range ({self._constraint_str()})",
                    )
            return EvaluationReason(
                value=False,
                reason=f"No neighbor found with threat in range ({self._constraint_str()})",
            )

        neighbor = _find_neighbor(output, self.country_id, self.neighbor_name)

        if neighbor is None:
            identifier = self.country_id or self.neighbor_name
            return EvaluationReason(
                value=False,
                reason=f"Neighbor '{identifier}' not found",
            )

        if neighbor.threat is None:
            return EvaluationReason(
                value=False,
                reason=f"Neighbor '{neighbor.name}' has no threat value",
            )

        if not self._check_threat_range(neighbor):
            if self.min_threat is not None and neighbor.threat < self.min_threat:
                return EvaluationReason(
                    value=False,
                    reason=f"Neighbor '{neighbor.name}' threat {neighbor.threat:.1f} is below minimum {self.min_threat:.1f}",
                )
            return EvaluationReason(
                value=False,
                reason=f"Neighbor '{neighbor.name}' threat {neighbor.threat:.1f} exceeds maximum {self.max_threat:.1f}",
            )

        return EvaluationReason(
            value=True,
            reason=f"Neighbor '{neighbor.name}' threat {neighbor.threat:.1f} within range ({self._constraint_str()})",
        )


@dataclass
class HasOpinionModifier(
    Evaluator[EvalInputs, Any, EvalMetadata],
):
    """Evaluator that asserts a neighbor has a specific opinion modifier."""

    country_id: str | None = None
    neighbor_name: str | None = None
    modifier_type: str | None = None
    modifier_contains: str | None = None

    @override
    def evaluate(
        self,
        ctx: EvaluatorContext[EvalInputs, Any, EvalMetadata],
    ) -> EvaluationReason:
        output = ctx.output
        neighbor = _find_neighbor(output, self.country_id, self.neighbor_name)

        if neighbor is None:
            identifier = self.country_id or self.neighbor_name
            return EvaluationReason(
                value=False,
                reason=f"Neighbor '{identifier}' not found",
            )

        for modifier in neighbor.opinion_modifiers:
            if (
                self.modifier_type is not None
                and modifier.modifier_type == self.modifier_type
            ):
                return EvaluationReason(
                    value=True,
                    reason=f"Neighbor '{neighbor.name}' has modifier '{self.modifier_type}' (value={modifier.value:.1f})",
                )
            if (
                self.modifier_contains is not None
                and self.modifier_contains in modifier.modifier_type
            ):
                return EvaluationReason(
                    value=True,
                    reason=f"Neighbor '{neighbor.name}' has modifier '{modifier.modifier_type}' containing '{self.modifier_contains}' (value={modifier.value:.1f})",
                )

        search_term = self.modifier_type or f"containing '{self.modifier_contains}'"
        modifier_types = [m.modifier_type for m in neighbor.opinion_modifiers]
        return EvaluationReason(
            value=False,
            reason=f"Neighbor '{neighbor.name}' does not have modifier {search_term}. Found: {modifier_types}",
        )
