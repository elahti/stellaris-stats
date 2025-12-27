from pydantic import BaseModel


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
