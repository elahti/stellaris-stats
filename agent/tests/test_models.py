import pytest
from pydantic import ValidationError

from agent.budget_agent.models import (
    BudgetAnalysisResult,
    BudgetChange,
    BudgetSnapshot,
    BudgetTimeSeries,
    ResourceChange,
    SaveInfo,
    SnapshotResourceTotals,
    SuddenDrop,
    SuddenDropAnalysisResult,
)


class TestSaveInfo:
    def test_creates_with_valid_data(self) -> None:
        save = SaveInfo(filename="test.sav", name="Test Empire")
        assert save.filename == "test.sav"
        assert save.name == "Test Empire"

    def test_requires_filename(self) -> None:
        with pytest.raises(ValidationError):
            SaveInfo(name="Test Empire")  # type: ignore[call-arg]

    def test_requires_name(self) -> None:
        with pytest.raises(ValidationError):
            SaveInfo(filename="test.sav")  # type: ignore[call-arg]

    def test_allows_empty_strings(self) -> None:
        save = SaveInfo(filename="", name="")
        assert save.filename == ""
        assert save.name == ""


class TestBudgetSnapshot:
    def test_creates_with_empty_budget(self) -> None:
        snapshot = BudgetSnapshot(date="2200-01-01", budget={})
        assert snapshot.date == "2200-01-01"
        assert snapshot.budget == {}

    def test_accepts_nested_budget_structure(self) -> None:
        budget = {
            "income": {"energy": 100.0, "minerals": 50.0},
            "expenses": {"energy": -30.0},
        }
        snapshot = BudgetSnapshot(date="2200-01-01", budget=budget)
        assert snapshot.budget["income"]["energy"] == 100.0

    def test_requires_date(self) -> None:
        with pytest.raises(ValidationError):
            BudgetSnapshot(budget={})  # type: ignore[call-arg]

    def test_requires_budget(self) -> None:
        with pytest.raises(ValidationError):
            BudgetSnapshot(date="2200-01-01")  # type: ignore[call-arg]


class TestSnapshotResourceTotals:
    def test_creates_with_valid_data(self) -> None:
        totals = SnapshotResourceTotals(
            date="2200-01-01",
            totals={"energy": 100.0, "minerals": 50.0},
        )
        assert totals.date == "2200-01-01"
        assert totals.totals["energy"] == 100.0

    def test_empty_totals(self) -> None:
        totals = SnapshotResourceTotals(date="2200-01-01", totals={})
        assert totals.totals == {}


class TestBudgetTimeSeries:
    def test_creates_with_minimal_data(self) -> None:
        series = BudgetTimeSeries(
            save_filename="test.sav",
            dates=["2200-01-01"],
            snapshots=[BudgetSnapshot(date="2200-01-01", budget={})],
        )
        assert series.save_filename == "test.sav"
        assert len(series.dates) == 1
        assert len(series.snapshots) == 1

    def test_resource_totals_defaults_to_none(self) -> None:
        series = BudgetTimeSeries(
            save_filename="test.sav",
            dates=[],
            snapshots=[],
        )
        assert series.resource_totals is None

    def test_accepts_resource_totals(self) -> None:
        series = BudgetTimeSeries(
            save_filename="test.sav",
            dates=["2200-01-01"],
            snapshots=[BudgetSnapshot(date="2200-01-01", budget={})],
            resource_totals=[
                SnapshotResourceTotals(date="2200-01-01", totals={"energy": 100.0}),
            ],
        )
        assert series.resource_totals is not None
        assert len(series.resource_totals) == 1


class TestResourceChange:
    def test_creates_with_all_fields(self) -> None:
        change = ResourceChange(
            resource="energy",
            previous_value=100.0,
            current_value=70.0,
            change_absolute=-30.0,
            change_percent=-30.0,
        )
        assert change.resource == "energy"
        assert change.change_percent == -30.0


class TestBudgetChange:
    def test_creates_with_changes(self) -> None:
        change = BudgetChange(
            category_type="income",
            category_name="Trade",
            changes=[
                ResourceChange(
                    resource="energy",
                    previous_value=100.0,
                    current_value=50.0,
                    change_absolute=-50.0,
                    change_percent=-50.0,
                ),
            ],
        )
        assert len(change.changes) == 1


class TestBudgetAnalysisResult:
    def test_creates_with_empty_changes(self) -> None:
        result = BudgetAnalysisResult(
            save_filename="test.sav",
            previous_date="2200-01-01",
            current_date="2200-02-01",
            threshold_percent=30.0,
            sudden_changes=[],
            summary="No changes detected",
        )
        assert len(result.sudden_changes) == 0


class TestSuddenDrop:
    def test_creates_with_all_fields(self) -> None:
        drop = SuddenDrop(
            resource="energy",
            start_date="2200-01-01",
            end_date="2200-04-01",
            start_value=100.0,
            end_value=50.0,
            drop_percent=50.0,
            drop_absolute=50.0,
        )
        assert drop.resource == "energy"
        assert drop.drop_percent == 50.0
        assert drop.drop_absolute == 50.0

    def test_allows_zero_values(self) -> None:
        drop = SuddenDrop(
            resource="energy",
            start_date="2200-01-01",
            end_date="2200-04-01",
            start_value=0.0,
            end_value=0.0,
            drop_percent=0.0,
            drop_absolute=0.0,
        )
        assert drop.start_value == 0.0

    def test_allows_negative_end_value(self) -> None:
        drop = SuddenDrop(
            resource="trade",
            start_date="2200-01-01",
            end_date="2200-04-01",
            start_value=100.0,
            end_value=-50.0,
            drop_percent=150.0,
            drop_absolute=150.0,
        )
        assert drop.end_value == -50.0


class TestSuddenDropAnalysisResult:
    def test_creates_with_empty_sudden_drops(self) -> None:
        result = SuddenDropAnalysisResult(
            save_filename="test.sav",
            analysis_period_start="2200-01-01",
            analysis_period_end="2200-04-01",
            datapoints_analyzed=4,
            drop_threshold_percent=30.0,
            sudden_drops=[],
            summary="No sudden drops detected",
        )
        assert len(result.sudden_drops) == 0
        assert result.datapoints_analyzed == 4

    def test_creates_with_multiple_drops(self) -> None:
        result = SuddenDropAnalysisResult(
            save_filename="test.sav",
            analysis_period_start="2200-01-01",
            analysis_period_end="2200-04-01",
            datapoints_analyzed=4,
            drop_threshold_percent=30.0,
            sudden_drops=[
                SuddenDrop(
                    resource="energy",
                    start_date="2200-01-01",
                    end_date="2200-04-01",
                    start_value=100.0,
                    end_value=50.0,
                    drop_percent=50.0,
                    drop_absolute=50.0,
                ),
                SuddenDrop(
                    resource="minerals",
                    start_date="2200-01-01",
                    end_date="2200-04-01",
                    start_value=200.0,
                    end_value=100.0,
                    drop_percent=50.0,
                    drop_absolute=100.0,
                ),
            ],
            summary="Multiple drops detected",
        )
        assert len(result.sudden_drops) == 2
