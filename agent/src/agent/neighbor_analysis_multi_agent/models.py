from pydantic import BaseModel

from agent.neighbor_analysis import FindingSeverity, OpinionModifier


class DetectedNeighbor(BaseModel):
    country_id: str
    name: str
    min_distance: float
    owned_planet_count: int


class NeighborDetectionResult(BaseModel):
    save_filename: str
    analysis_date: str
    player_empire_name: str
    player_owned_planets: int
    detected_neighbors: list[DetectedNeighbor]


class NeighborFinding(BaseModel):
    finding_type: str
    description: str
    severity: FindingSeverity


class OpinionAnalysisResult(BaseModel):
    country_id: str
    name: str
    opinion: float | None
    trust: float | None
    threat: float | None
    is_hostile: bool
    opinion_modifiers: list[OpinionModifier]
    findings: list[NeighborFinding]
