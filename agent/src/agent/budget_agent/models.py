from collections.abc import Mapping

from pydantic import BaseModel

BudgetEntryData = Mapping[str, float | None]
BudgetCategoryData = Mapping[str, BudgetEntryData | None]


class SaveInfo(BaseModel):
    """Information about an available save file."""

    filename: str
    name: str


class BudgetSnapshot(BaseModel):
    """A single budget snapshot at a point in time."""

    date: str
    budget: BudgetCategoryData


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
