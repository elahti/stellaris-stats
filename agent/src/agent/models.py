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


class BudgetTimeSeries(BaseModel):
    """Time series budget data for analysis."""

    save_filename: str
    dates: list[str]
    snapshots: list[BudgetSnapshot]
    threshold_consecutive_periods: int


class ResourceChange(BaseModel):
    """A change in a specific resource between two time periods."""

    resource: str
    previous_value: float
    current_value: float
    change_absolute: float
    change_percent: float


class BudgetChange(BaseModel):
    """A detected sudden change in a budget category."""

    category_type: str
    category_name: str
    changes: list[ResourceChange]


class BudgetAnalysisResult(BaseModel):
    """Result of analyzing budget changes between two dates."""

    save_filename: str
    previous_date: str
    current_date: str
    threshold_percent: float
    sudden_changes: list[BudgetChange]
    summary: str


class SustainedDrop(BaseModel):
    """A resource that has been negative for multiple consecutive periods."""

    category_name: str
    resource: str
    consecutive_low_periods: int
    values: list[float | None]
    baseline_value: float


class SustainedDropAnalysisResult(BaseModel):
    """Result of analyzing sustained resource drops."""

    save_filename: str
    analysis_period_start: str
    analysis_period_end: str
    datapoints_analyzed: int
    threshold_consecutive_periods: int
    sustained_drops: list[SustainedDrop]
    summary: str
