from enum import StrEnum

from pydantic import BaseModel


class ContributorType(StrEnum):
    INCOME_DECREASED = "income_decreased"
    EXPENSES_INCREASED = "expenses_increased"


class SuddenDrop(BaseModel):
    """A sudden drop in a resource between first and last datapoint in analysis window."""

    resource: str
    start_date: str
    end_date: str
    start_value: float
    end_value: float
    drop_percent: float
    drop_absolute: float


class SuddenDropAnalysisResult(BaseModel):
    """Result of analyzing sudden resource drops."""

    save_filename: str
    analysis_period_start: str
    analysis_period_end: str
    datapoints_analyzed: int
    drop_threshold_percent: float
    sudden_drops: list[SuddenDrop]
    summary: str


class CategoryContributor(BaseModel):
    """A budget category that contributed to a resource drop."""

    category: str
    resource: str
    contributor_type: ContributorType
    before_value: float
    after_value: float
    change_absolute: float
    change_percent: float
    rank: int


class RootCauseAnalysisResult(BaseModel):
    """Root cause analysis for a single sudden drop."""

    resource: str
    start_date: str
    end_date: str
    drop_percent: float
    top_contributors: list[CategoryContributor]
    explanation: str


class SuddenDropWithRootCause(BaseModel):
    """A sudden drop enriched with root cause analysis."""

    drop: SuddenDrop
    root_cause: RootCauseAnalysisResult | None
    analysis_error: str | None


class MultiAgentAnalysisResult(BaseModel):
    """Final result from the multi-agent workflow."""

    save_filename: str
    analysis_period_start: str
    analysis_period_end: str
    datapoints_analyzed: int
    drop_threshold_percent: float
    drops_with_root_causes: list[SuddenDropWithRootCause]
    total_drops_detected: int
    successful_root_cause_analyses: int
    summary: str
