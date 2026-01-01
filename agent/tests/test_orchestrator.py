from agent.models import SuddenDrop, SuddenDropWithRootCause


class TestSuddenDropWithRootCause:
    def test_can_create_with_root_cause(self) -> None:
        drop = _create_sample_drop("energy")
        result = SuddenDropWithRootCause(
            drop=drop,
            root_cause=None,
            analysis_error=None,
        )

        assert result.drop == drop
        assert result.root_cause is None
        assert result.analysis_error is None

    def test_can_create_with_analysis_error(self) -> None:
        drop = _create_sample_drop("minerals")
        result = SuddenDropWithRootCause(
            drop=drop,
            root_cause=None,
            analysis_error="API timeout",
        )

        assert result.drop == drop
        assert result.analysis_error == "API timeout"

    def test_serializes_to_dict(self) -> None:
        drop = _create_sample_drop("energy")
        result = SuddenDropWithRootCause(
            drop=drop,
            root_cause=None,
            analysis_error="Test error",
        )

        data = result.model_dump()

        assert data["drop"]["resource"] == "energy"
        assert data["analysis_error"] == "Test error"


class TestSuddenDrop:
    def test_creates_with_all_fields(self) -> None:
        drop = SuddenDrop(
            resource="energy",
            start_date="2307-01-01",
            end_date="2307-04-01",
            start_value=100.0,
            end_value=60.0,
            drop_percent=40.0,
            drop_absolute=40.0,
        )

        assert drop.resource == "energy"
        assert drop.start_value == 100.0
        assert drop.end_value == 60.0
        assert drop.drop_percent == 40.0

    def test_serializes_to_json(self) -> None:
        drop = _create_sample_drop("minerals")
        json_str = drop.model_dump_json()

        assert "minerals" in json_str
        assert "start_value" in json_str

    def test_can_compare_drops(self) -> None:
        drop1 = _create_sample_drop("energy")
        drop2 = _create_sample_drop("energy")

        assert drop1 == drop2

    def test_different_resources_not_equal(self) -> None:
        drop1 = _create_sample_drop("energy")
        drop2 = _create_sample_drop("minerals")

        assert drop1 != drop2


def _create_sample_drop(resource: str) -> SuddenDrop:
    return SuddenDrop(
        resource=resource,
        start_date="2307-01-01 00:00:00+00:00",
        end_date="2307-04-01 00:00:00+00:00",
        start_value=100.0,
        end_value=60.0,
        drop_percent=40.0,
        drop_absolute=40.0,
    )
