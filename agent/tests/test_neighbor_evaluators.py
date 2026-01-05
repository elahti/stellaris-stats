from unittest.mock import MagicMock

from agent.evals.evaluators.neighbor_quality import (
    HasFindingType,
    HasOpinionModifier,
    HostileNeighborDetected,
    NeighborCount,
    NeighborDetected,
    NeighborDistanceOrder,
    NeighborOpinionRange,
    NeighborThreatRange,
    NoFindingType,
)
from agent.neighbor import (
    FindingSeverity,
    KeyFinding,
    NeighborAnalysisResult,
    NeighborInfo,
    OpinionModifier,
)


def _create_mock_context(output: NeighborAnalysisResult) -> MagicMock:
    ctx: MagicMock = MagicMock()
    ctx.output = output
    return ctx


def _create_result(
    neighbors: list[NeighborInfo] | None = None,
    findings: list[KeyFinding] | None = None,
) -> NeighborAnalysisResult:
    return NeighborAnalysisResult(
        save_filename="test.sav",
        analysis_date="2300-01-01",
        player_empire_name="Test Empire",
        player_owned_planets=5,
        neighbors=neighbors or [],
        key_findings=findings or [],
        summary="Test summary",
    )


def _create_neighbor(
    country_id: str = "1",
    name: str = "Test Neighbor",
    min_distance: float = 50.0,
    owned_planet_count: int = 3,
    opinion: float | None = 0.0,
    trust: float | None = 0.0,
    threat: float | None = 0.0,
    is_hostile: bool | None = False,
    opinion_modifiers: list[OpinionModifier] | None = None,
) -> NeighborInfo:
    return NeighborInfo(
        country_id=country_id,
        name=name,
        min_distance=min_distance,
        owned_planet_count=owned_planet_count,
        opinion=opinion,
        trust=trust,
        threat=threat,
        is_hostile=is_hostile,
        opinion_modifiers=opinion_modifiers or [],
    )


def _create_finding(
    finding_type: str = "hostile_neighbor",
    severity: FindingSeverity = FindingSeverity.CRITICAL,
    description: str = "Test finding",
) -> KeyFinding:
    return KeyFinding(
        finding_type=finding_type,
        severity=severity,
        description=description,
    )


class TestNeighborDetected:
    def test_returns_true_when_neighbor_found_by_country_id(self) -> None:
        evaluator = NeighborDetected(country_id="123")
        neighbor = _create_neighbor(country_id="123", name="Empire A")
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True
        assert evaluation.reason is not None
        assert "Empire A" in evaluation.reason

    def test_returns_true_when_neighbor_found_by_name(self) -> None:
        evaluator = NeighborDetected(neighbor_name="Empire B")
        neighbor = _create_neighbor(country_id="456", name="Empire B")
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True
        assert evaluation.reason is not None
        assert "Empire B" in evaluation.reason

    def test_returns_false_when_neighbor_not_found(self) -> None:
        evaluator = NeighborDetected(country_id="999")
        neighbor = _create_neighbor(country_id="123")
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "not found" in evaluation.reason

    def test_returns_false_with_empty_neighbors(self) -> None:
        evaluator = NeighborDetected(country_id="123")
        result = _create_result(neighbors=[])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False


class TestNeighborCount:
    def test_returns_true_when_exact_count_matches(self) -> None:
        evaluator = NeighborCount(exact_count=2)
        neighbors = [_create_neighbor(country_id="1"), _create_neighbor(country_id="2")]
        result = _create_result(neighbors=neighbors)
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True
        assert evaluation.reason is not None
        assert "2 neighbors" in evaluation.reason

    def test_returns_false_when_exact_count_differs(self) -> None:
        evaluator = NeighborCount(exact_count=3)
        neighbors = [_create_neighbor(country_id="1"), _create_neighbor(country_id="2")]
        result = _create_result(neighbors=neighbors)
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "Expected 3" in evaluation.reason

    def test_returns_true_when_min_count_satisfied(self) -> None:
        evaluator = NeighborCount(min_count=2)
        neighbors = [
            _create_neighbor(country_id="1"),
            _create_neighbor(country_id="2"),
            _create_neighbor(country_id="3"),
        ]
        result = _create_result(neighbors=neighbors)
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True

    def test_returns_false_when_below_min_count(self) -> None:
        evaluator = NeighborCount(min_count=3)
        neighbors = [_create_neighbor(country_id="1")]
        result = _create_result(neighbors=neighbors)
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "at least" in evaluation.reason

    def test_returns_true_when_max_count_satisfied(self) -> None:
        evaluator = NeighborCount(max_count=3)
        neighbors = [_create_neighbor(country_id="1"), _create_neighbor(country_id="2")]
        result = _create_result(neighbors=neighbors)
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True

    def test_returns_false_when_above_max_count(self) -> None:
        evaluator = NeighborCount(max_count=1)
        neighbors = [_create_neighbor(country_id="1"), _create_neighbor(country_id="2")]
        result = _create_result(neighbors=neighbors)
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "at most" in evaluation.reason


class TestNeighborDistanceOrder:
    def test_returns_true_when_neighbors_sorted_by_distance(self) -> None:
        evaluator = NeighborDistanceOrder()
        neighbors = [
            _create_neighbor(country_id="1", min_distance=50.0),
            _create_neighbor(country_id="2", min_distance=100.0),
            _create_neighbor(country_id="3", min_distance=150.0),
        ]
        result = _create_result(neighbors=neighbors)
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True
        assert evaluation.reason is not None
        assert "correctly sorted" in evaluation.reason

    def test_returns_false_when_neighbors_not_sorted(self) -> None:
        evaluator = NeighborDistanceOrder()
        neighbors = [
            _create_neighbor(country_id="1", name="Closer", min_distance=100.0),
            _create_neighbor(country_id="2", name="Further", min_distance=50.0),
        ]
        result = _create_result(neighbors=neighbors)
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "should come after" in evaluation.reason

    def test_returns_true_when_single_neighbor(self) -> None:
        evaluator = NeighborDistanceOrder()
        neighbors = [_create_neighbor(country_id="1")]
        result = _create_result(neighbors=neighbors)
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True

    def test_returns_true_when_no_neighbors(self) -> None:
        evaluator = NeighborDistanceOrder()
        result = _create_result(neighbors=[])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True


class TestHasFindingType:
    def test_returns_true_when_finding_type_present(self) -> None:
        evaluator = HasFindingType(finding_type="hostile_neighbor")
        finding = _create_finding(finding_type="hostile_neighbor")
        result = _create_result(findings=[finding])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True
        assert evaluation.reason is not None
        assert "hostile_neighbor" in evaluation.reason

    def test_returns_true_when_finding_type_and_severity_match(self) -> None:
        evaluator = HasFindingType(
            finding_type="hostile_neighbor",
            severity=FindingSeverity.CRITICAL,
        )
        finding = _create_finding(
            finding_type="hostile_neighbor",
            severity=FindingSeverity.CRITICAL,
        )
        result = _create_result(findings=[finding])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True

    def test_returns_false_when_severity_mismatch(self) -> None:
        evaluator = HasFindingType(
            finding_type="hostile_neighbor",
            severity=FindingSeverity.WARNING,
        )
        finding = _create_finding(
            finding_type="hostile_neighbor",
            severity=FindingSeverity.CRITICAL,
        )
        result = _create_result(findings=[finding])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "severity" in evaluation.reason

    def test_returns_false_when_finding_type_not_present(self) -> None:
        evaluator = HasFindingType(finding_type="hostile_neighbor")
        finding = _create_finding(finding_type="low_opinion")
        result = _create_result(findings=[finding])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "not detected" in evaluation.reason


class TestNoFindingType:
    def test_returns_true_when_finding_type_absent(self) -> None:
        evaluator = NoFindingType(finding_type="hostile_neighbor")
        finding = _create_finding(finding_type="low_opinion")
        result = _create_result(findings=[finding])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True
        assert evaluation.reason is not None
        assert "No 'hostile_neighbor'" in evaluation.reason

    def test_returns_true_when_no_findings(self) -> None:
        evaluator = NoFindingType(finding_type="hostile_neighbor")
        result = _create_result(findings=[])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True

    def test_returns_false_when_finding_type_present(self) -> None:
        evaluator = NoFindingType(finding_type="hostile_neighbor")
        finding = _create_finding(finding_type="hostile_neighbor")
        result = _create_result(findings=[finding])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "Unexpected" in evaluation.reason


class TestHostileNeighborDetected:
    def test_returns_true_when_any_hostile_neighbor_exists(self) -> None:
        evaluator = HostileNeighborDetected()
        neighbor = _create_neighbor(country_id="1", name="Evil Empire", is_hostile=True)
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True
        assert evaluation.reason is not None
        assert "Evil Empire" in evaluation.reason

    def test_returns_false_when_no_hostile_neighbors(self) -> None:
        evaluator = HostileNeighborDetected()
        neighbor = _create_neighbor(country_id="1", is_hostile=False)
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "No hostile" in evaluation.reason

    def test_returns_true_when_specific_neighbor_is_hostile(self) -> None:
        evaluator = HostileNeighborDetected(country_id="2")
        neighbors = [
            _create_neighbor(country_id="1", is_hostile=False),
            _create_neighbor(country_id="2", name="Target", is_hostile=True),
        ]
        result = _create_result(neighbors=neighbors)
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True
        assert evaluation.reason is not None
        assert "Target" in evaluation.reason

    def test_returns_false_when_specific_neighbor_not_hostile(self) -> None:
        evaluator = HostileNeighborDetected(country_id="1")
        neighbor = _create_neighbor(country_id="1", name="Peaceful", is_hostile=False)
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "is_hostile=False" in evaluation.reason

    def test_returns_false_when_specific_neighbor_not_found(self) -> None:
        evaluator = HostileNeighborDetected(country_id="999")
        neighbor = _create_neighbor(country_id="1", is_hostile=True)
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "not found" in evaluation.reason


class TestNeighborOpinionRange:
    def test_returns_true_when_opinion_within_range(self) -> None:
        evaluator = NeighborOpinionRange(
            country_id="1",
            min_opinion=-50.0,
            max_opinion=50.0,
        )
        neighbor = _create_neighbor(country_id="1", opinion=25.0)
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True
        assert evaluation.reason is not None
        assert "within range" in evaluation.reason

    def test_returns_false_when_opinion_below_min(self) -> None:
        evaluator = NeighborOpinionRange(country_id="1", min_opinion=-50.0)
        neighbor = _create_neighbor(country_id="1", opinion=-75.0)
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "below minimum" in evaluation.reason

    def test_returns_false_when_opinion_above_max(self) -> None:
        evaluator = NeighborOpinionRange(country_id="1", max_opinion=50.0)
        neighbor = _create_neighbor(country_id="1", opinion=75.0)
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "exceeds maximum" in evaluation.reason

    def test_returns_false_when_neighbor_not_found(self) -> None:
        evaluator = NeighborOpinionRange(country_id="999", max_opinion=50.0)
        neighbor = _create_neighbor(country_id="1", opinion=0.0)
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "not found" in evaluation.reason

    def test_returns_false_when_opinion_is_none(self) -> None:
        evaluator = NeighborOpinionRange(country_id="1", max_opinion=50.0)
        neighbor = _create_neighbor(country_id="1", opinion=None)
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "no opinion value" in evaluation.reason


class TestNeighborThreatRange:
    def test_returns_true_when_threat_within_range(self) -> None:
        evaluator = NeighborThreatRange(country_id="1", min_threat=50.0)
        neighbor = _create_neighbor(country_id="1", threat=75.0)
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True
        assert evaluation.reason is not None
        assert "within range" in evaluation.reason

    def test_returns_false_when_threat_below_min(self) -> None:
        evaluator = NeighborThreatRange(country_id="1", min_threat=50.0)
        neighbor = _create_neighbor(country_id="1", threat=25.0)
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "below minimum" in evaluation.reason

    def test_returns_false_when_neighbor_not_found(self) -> None:
        evaluator = NeighborThreatRange(country_id="999", min_threat=50.0)
        neighbor = _create_neighbor(country_id="1", threat=75.0)
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "not found" in evaluation.reason


class TestHasOpinionModifier:
    def test_returns_true_when_modifier_type_matches(self) -> None:
        evaluator = HasOpinionModifier(
            country_id="1",
            modifier_type="opinion_genocidal",
        )
        modifier = OpinionModifier(modifier_type="opinion_genocidal", value=-100.0)
        neighbor = _create_neighbor(country_id="1", opinion_modifiers=[modifier])
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True
        assert evaluation.reason is not None
        assert "opinion_genocidal" in evaluation.reason

    def test_returns_true_when_modifier_contains_substring(self) -> None:
        evaluator = HasOpinionModifier(country_id="1", modifier_contains="genocidal")
        modifier = OpinionModifier(modifier_type="opinion_genocidal", value=-100.0)
        neighbor = _create_neighbor(country_id="1", opinion_modifiers=[modifier])
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True
        assert evaluation.reason is not None
        assert "genocidal" in evaluation.reason

    def test_returns_false_when_modifier_not_found(self) -> None:
        evaluator = HasOpinionModifier(
            country_id="1",
            modifier_type="opinion_genocidal",
        )
        modifier = OpinionModifier(modifier_type="opinion_alliance", value=50.0)
        neighbor = _create_neighbor(country_id="1", opinion_modifiers=[modifier])
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "does not have modifier" in evaluation.reason

    def test_returns_false_when_neighbor_not_found(self) -> None:
        evaluator = HasOpinionModifier(
            country_id="999",
            modifier_type="opinion_genocidal",
        )
        neighbor = _create_neighbor(country_id="1")
        result = _create_result(neighbors=[neighbor])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "not found" in evaluation.reason
