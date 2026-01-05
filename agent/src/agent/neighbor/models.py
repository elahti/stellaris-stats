from enum import StrEnum

from pydantic import BaseModel


class FindingSeverity(StrEnum):
    """Severity levels for key findings in neighbor analysis."""

    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class OpinionModifier(BaseModel):
    """A diplomatic opinion modifier between empires."""

    modifier_type: str
    value: float


class NeighborInfo(BaseModel):
    """Information about a neighboring empire including distance and diplomatic status."""

    country_id: str
    name: str
    min_distance: float
    owned_planet_count: int
    opinion: float | None
    trust: float | None
    threat: float | None
    is_hostile: bool | None
    opinion_modifiers: list[OpinionModifier]


class KeyFinding(BaseModel):
    """A notable finding from the neighbor analysis such as hostile relations."""

    finding_type: str
    description: str
    severity: FindingSeverity


class NeighborAnalysisResult(BaseModel):
    """Complete result of a neighbor analysis including all neighbors and findings."""

    save_filename: str
    analysis_date: str
    player_empire_name: str
    player_owned_planets: int
    neighbors: list[NeighborInfo]
    key_findings: list[KeyFinding]
    summary: str
