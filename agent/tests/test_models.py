from agent.models import SuddenDrop, SuddenDropAnalysisResult


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
