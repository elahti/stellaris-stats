from unittest.mock import MagicMock

from agent.budget_agent.models import SuddenDrop, SuddenDropAnalysisResult
from agent.evals.evaluators.output_quality import NoResourceDrop, ResourceDrop


def _create_mock_context(
    output: SuddenDropAnalysisResult,
) -> MagicMock:
    ctx: MagicMock = MagicMock()
    ctx.output = output
    return ctx


def _create_result_with_drops(drops: list[SuddenDrop]) -> SuddenDropAnalysisResult:
    return SuddenDropAnalysisResult(
        save_filename="test.sav",
        analysis_period_start="2200-01-01",
        analysis_period_end="2200-04-01",
        datapoints_analyzed=4,
        drop_threshold_percent=30.0,
        sudden_drops=drops,
        summary="Test result",
    )


def _create_drop(
    resource: str,
    drop_percent: float,
    start_value: float = 100.0,
) -> SuddenDrop:
    end_value = start_value * (1 - drop_percent / 100)
    return SuddenDrop(
        resource=resource,
        start_date="2200-01-01",
        end_date="2200-04-01",
        start_value=start_value,
        end_value=end_value,
        drop_percent=drop_percent,
        drop_absolute=start_value - end_value,
    )


class TestNoResourceDrop:
    def test_returns_true_when_no_drops_at_all(self) -> None:
        evaluator = NoResourceDrop(resource="energy")
        result = _create_result_with_drops([])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True
        assert evaluation.reason is not None
        assert "No energy drops" in evaluation.reason

    def test_returns_true_when_other_resource_drops(self) -> None:
        evaluator = NoResourceDrop(resource="energy")
        drop = _create_drop("minerals", 50.0)
        result = _create_result_with_drops([drop])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True

    def test_returns_false_when_resource_has_drop(self) -> None:
        evaluator = NoResourceDrop(resource="energy")
        drop = _create_drop("energy", 50.0)
        result = _create_result_with_drops([drop])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "energy drop detected" in evaluation.reason

    def test_reports_drop_details_in_reason(self) -> None:
        evaluator = NoResourceDrop(resource="energy")
        drop = SuddenDrop(
            resource="energy",
            start_date="2200-01-01",
            end_date="2200-04-01",
            start_value=100.0,
            end_value=50.0,
            drop_percent=50.0,
            drop_absolute=50.0,
        )
        result = _create_result_with_drops([drop])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.reason is not None
        assert "50.0%" in evaluation.reason
        assert "100.00" in evaluation.reason
        assert "50.00" in evaluation.reason


class TestResourceDrop:
    def test_returns_false_when_no_drop_detected(self) -> None:
        evaluator = ResourceDrop(resource="energy", min_drop_percent=30.0)
        result = _create_result_with_drops([])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "No energy drop detected" in evaluation.reason

    def test_returns_false_when_other_resource_drops(self) -> None:
        evaluator = ResourceDrop(resource="energy", min_drop_percent=30.0)
        drop = _create_drop("minerals", 50.0)
        result = _create_result_with_drops([drop])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False

    def test_returns_true_when_drop_exceeds_threshold(self) -> None:
        evaluator = ResourceDrop(resource="energy", min_drop_percent=30.0)
        drop = _create_drop("energy", 50.0)
        result = _create_result_with_drops([drop])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True
        assert evaluation.reason is not None
        assert ">=" in evaluation.reason

    def test_returns_true_when_drop_equals_threshold(self) -> None:
        evaluator = ResourceDrop(resource="energy", min_drop_percent=50.0)
        drop = _create_drop("energy", 50.0)
        result = _create_result_with_drops([drop])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True

    def test_returns_false_when_drop_below_threshold(self) -> None:
        evaluator = ResourceDrop(resource="energy", min_drop_percent=60.0)
        drop = _create_drop("energy", 50.0)
        result = _create_result_with_drops([drop])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is False
        assert evaluation.reason is not None
        assert "below expected" in evaluation.reason

    def test_uses_max_qualifying_drop_when_multiple_drops_for_same_resource(
        self,
    ) -> None:
        evaluator = ResourceDrop(resource="energy", min_drop_percent=30.0)
        drop1 = _create_drop("energy", 50.0)
        drop2 = _create_drop("energy", 80.0)
        result = _create_result_with_drops([drop1, drop2])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True
        assert evaluation.reason is not None
        assert "80.0%" in evaluation.reason

    def test_passes_when_later_drop_meets_threshold(self) -> None:
        evaluator = ResourceDrop(resource="energy", min_drop_percent=100.0)
        drop1 = _create_drop("energy", 31.7)
        drop2 = _create_drop("energy", 110.8)
        result = _create_result_with_drops([drop1, drop2])
        ctx = _create_mock_context(result)

        evaluation = evaluator.evaluate(ctx)
        assert evaluation.value is True
        assert evaluation.reason is not None
        assert "110.8%" in evaluation.reason
