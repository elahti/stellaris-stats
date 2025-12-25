from typing import Any

from pydantic import BaseModel


class SaveInfo(BaseModel):
    """Information about an available save file."""

    filename: str
    name: str


class BudgetSnapshot(BaseModel):
    """A single budget snapshot at a point in time."""

    date: str
    budget: dict[str, Any]


class SnapshotResourceTotals(BaseModel):
    """Resource totals summed across all budget categories for a single snapshot."""

    date: str
    totals: dict[str, float]


class BudgetTimeSeries(BaseModel):
    """Time series budget data for analysis."""

    save_filename: str
    dates: list[str]
    snapshots: list[BudgetSnapshot]
    resource_totals: list[SnapshotResourceTotals] | None = None


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
