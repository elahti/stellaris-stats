from pydantic import BaseModel

from agent.neighbor import FindingSeverity, OpinionModifier


class DetectedNeighbor(BaseModel):
    """A neighbor detected by the neighbor detection agent."""

    country_id: str
    name: str
    min_distance: float
    owned_planet_count: int


class NeighborDetectionResult(BaseModel):
    """Result from the neighbor detection phase including all detected neighbors."""

    save_filename: str
    analysis_date: str
    player_empire_name: str
    player_owned_planets: int
    detected_neighbors: list[DetectedNeighbor]


class NeighborFinding(BaseModel):
    """A finding from analyzing a specific neighbor's diplomatic relations."""

    finding_type: str
    description: str
    severity: FindingSeverity


class OpinionAnalysisResult(BaseModel):
    """Result from analyzing a neighbor's opinion and diplomatic status."""

    country_id: str
    name: str
    opinion: float | None
    trust: float | None
    threat: float | None
    is_hostile: bool
    opinion_modifiers: list[OpinionModifier]
    findings: list[NeighborFinding]
