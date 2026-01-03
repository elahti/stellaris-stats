from enum import StrEnum

from pydantic import BaseModel


class FindingSeverity(StrEnum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class OpinionModifier(BaseModel):
    modifier_type: str
    value: float


class NeighborInfo(BaseModel):
    country_id: str
    name: str
    min_distance: float
    owned_planet_count: int
    opinion: float | None
    trust: float | None
    threat: float | None
    is_hostile: bool
    opinion_modifiers: list[OpinionModifier]


class KeyFinding(BaseModel):
    finding_type: str
    description: str
    severity: FindingSeverity


class NeighborAnalysisResult(BaseModel):
    save_filename: str
    analysis_date: str
    player_empire_name: str
    player_owned_planets: int
    neighbors: list[NeighborInfo]
    key_findings: list[KeyFinding]
    summary: str
