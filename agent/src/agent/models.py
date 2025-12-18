from pydantic import BaseModel


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


class BudgetComparisonData(BaseModel):
    """Budget comparison data between two dates."""

    previous_date: str
    current_date: str
    previous_budget: dict[str, dict[str, float | None] | None]
    current_budget: dict[str, dict[str, float | None] | None]


class BudgetComparisonError(BaseModel):
    """Error result from budget comparison."""

    error: str
