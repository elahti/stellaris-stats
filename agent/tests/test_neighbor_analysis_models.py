from agent.neighbor import (
    FindingSeverity,
    KeyFinding,
    NeighborAnalysisResult,
    NeighborInfo,
    OpinionModifier,
)
from agent.neighbor_multi.models import (
    DetectedNeighbor,
    NeighborDetectionResult,
    NeighborFinding,
    OpinionAnalysisResult,
)


class TestOpinionModifier:
    def test_creates_with_required_fields(self) -> None:
        modifier = OpinionModifier(
            modifier_type="alliance",
            value=50.0,
        )
        assert modifier.modifier_type == "alliance"
        assert modifier.value == 50.0

    def test_allows_negative_value(self) -> None:
        modifier = OpinionModifier(
            modifier_type="border_friction",
            value=-30.0,
        )
        assert modifier.value == -30.0


class TestNeighborInfo:
    def test_creates_with_all_fields(self) -> None:
        neighbor = NeighborInfo(
            country_id="1",
            name="Galactic Empire",
            min_distance=50.5,
            owned_planet_count=10,
            opinion=75.0,
            trust=25.0,
            threat=10.0,
            is_hostile=False,
            opinion_modifiers=[
                OpinionModifier(modifier_type="alliance", value=50.0),
            ],
        )
        assert neighbor.country_id == "1"
        assert neighbor.name == "Galactic Empire"
        assert neighbor.min_distance == 50.5
        assert neighbor.owned_planet_count == 10
        assert neighbor.opinion == 75.0
        assert neighbor.is_hostile is False
        assert len(neighbor.opinion_modifiers) == 1

    def test_allows_null_opinion_values(self) -> None:
        neighbor = NeighborInfo(
            country_id="2",
            name="Unknown Empire",
            min_distance=100.0,
            owned_planet_count=5,
            opinion=None,
            trust=None,
            threat=None,
            is_hostile=None,
            opinion_modifiers=[],
        )
        assert neighbor.opinion is None
        assert neighbor.trust is None
        assert neighbor.threat is None
        assert neighbor.is_hostile is None

    def test_allows_hostile_status(self) -> None:
        neighbor = NeighborInfo(
            country_id="3",
            name="Hostile Empire",
            min_distance=25.0,
            owned_planet_count=15,
            opinion=-100.0,
            trust=-50.0,
            threat=100.0,
            is_hostile=True,
            opinion_modifiers=[],
        )
        assert neighbor.is_hostile is True
        assert neighbor.opinion == -100.0


class TestKeyFinding:
    def test_creates_critical_finding(self) -> None:
        finding = KeyFinding(
            finding_type="hostile_neighbor",
            description="Hostile empire detected",
            severity=FindingSeverity.CRITICAL,
        )
        assert finding.severity == FindingSeverity.CRITICAL

    def test_creates_warning_finding(self) -> None:
        finding = KeyFinding(
            finding_type="low_opinion",
            description="Low opinion detected",
            severity=FindingSeverity.WARNING,
        )
        assert finding.severity == FindingSeverity.WARNING

    def test_creates_info_finding(self) -> None:
        finding = KeyFinding(
            finding_type="close_neighbor",
            description="Close neighbor detected",
            severity=FindingSeverity.INFO,
        )
        assert finding.severity == FindingSeverity.INFO


class TestNeighborAnalysisResult:
    def test_creates_with_empty_neighbors(self) -> None:
        result = NeighborAnalysisResult(
            save_filename="test.sav",
            analysis_date="2200-01-01",
            player_empire_name="Player Empire",
            player_owned_planets=5,
            neighbors=[],
            key_findings=[],
            summary="No neighbors detected",
        )
        assert len(result.neighbors) == 0
        assert result.player_owned_planets == 5

    def test_creates_with_multiple_neighbors(self) -> None:
        result = NeighborAnalysisResult(
            save_filename="test.sav",
            analysis_date="2200-01-01",
            player_empire_name="Player Empire",
            player_owned_planets=5,
            neighbors=[
                NeighborInfo(
                    country_id="1",
                    name="Empire 1",
                    min_distance=50.0,
                    owned_planet_count=10,
                    opinion=50.0,
                    trust=25.0,
                    threat=10.0,
                    is_hostile=False,
                    opinion_modifiers=[],
                ),
                NeighborInfo(
                    country_id="2",
                    name="Empire 2",
                    min_distance=75.0,
                    owned_planet_count=8,
                    opinion=-50.0,
                    trust=-25.0,
                    threat=50.0,
                    is_hostile=True,
                    opinion_modifiers=[],
                ),
            ],
            key_findings=[
                KeyFinding(
                    finding_type="hostile_neighbor",
                    description="Hostile empire detected",
                    severity=FindingSeverity.CRITICAL,
                ),
            ],
            summary="2 neighbors detected, 1 hostile",
        )
        assert len(result.neighbors) == 2
        assert len(result.key_findings) == 1


class TestDetectedNeighbor:
    def test_creates_with_required_fields(self) -> None:
        neighbor = DetectedNeighbor(
            country_id="1",
            name="Detected Empire",
            min_distance=50.0,
            owned_planet_count=10,
        )
        assert neighbor.country_id == "1"
        assert neighbor.min_distance == 50.0


class TestNeighborDetectionResult:
    def test_creates_with_empty_neighbors(self) -> None:
        result = NeighborDetectionResult(
            save_filename="test.sav",
            analysis_date="2200-01-01",
            player_empire_name="Player Empire",
            player_owned_planets=5,
            detected_neighbors=[],
        )
        assert len(result.detected_neighbors) == 0

    def test_creates_with_neighbors(self) -> None:
        result = NeighborDetectionResult(
            save_filename="test.sav",
            analysis_date="2200-01-01",
            player_empire_name="Player Empire",
            player_owned_planets=5,
            detected_neighbors=[
                DetectedNeighbor(
                    country_id="1",
                    name="Empire 1",
                    min_distance=50.0,
                    owned_planet_count=10,
                ),
            ],
        )
        assert len(result.detected_neighbors) == 1


class TestNeighborFinding:
    def test_creates_with_severity(self) -> None:
        finding = NeighborFinding(
            finding_type="test_finding",
            description="Test description",
            severity=FindingSeverity.WARNING,
        )
        assert finding.severity == FindingSeverity.WARNING


class TestOpinionAnalysisResult:
    def test_creates_with_all_fields(self) -> None:
        result = OpinionAnalysisResult(
            country_id="1",
            name="Analyzed Empire",
            opinion=50.0,
            trust=25.0,
            threat=10.0,
            is_hostile=False,
            opinion_modifiers=[
                OpinionModifier(modifier_type="alliance", value=50.0),
            ],
            findings=[],
        )
        assert result.opinion == 50.0
        assert result.is_hostile is False
        assert len(result.opinion_modifiers) == 1

    def test_creates_hostile_result(self) -> None:
        result = OpinionAnalysisResult(
            country_id="2",
            name="Hostile Empire",
            opinion=-100.0,
            trust=-50.0,
            threat=100.0,
            is_hostile=True,
            opinion_modifiers=[],
            findings=[
                NeighborFinding(
                    finding_type="hostile_neighbor",
                    description="This empire is hostile",
                    severity=FindingSeverity.CRITICAL,
                ),
            ],
        )
        assert result.is_hostile is True
        assert len(result.findings) == 1
