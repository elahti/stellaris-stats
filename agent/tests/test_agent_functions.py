from agent.budget_agent.agent import (
    ANALYSIS_DATAPOINTS,
    DROP_THRESHOLD_PERCENT,
    RESOURCE_FIELDS,
    build_analysis_prompt,
    build_system_prompt,
    sum_resources_for_snapshot,
)
from agent.budget_agent.models import BudgetSnapshot


class TestSumResourcesForSnapshot:
    def test_sums_single_category(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={
                "income": {"energy": 100.0, "minerals": 50.0},
            },
        )
        result = sum_resources_for_snapshot(snapshot)
        assert result["energy"] == 100.0
        assert result["minerals"] == 50.0

    def test_sums_multiple_categories(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={
                "income": {"energy": 100.0, "minerals": 50.0},
                "expenses": {"energy": -30.0, "minerals": -20.0},
            },
        )
        result = sum_resources_for_snapshot(snapshot)
        assert result["energy"] == 70.0
        assert result["minerals"] == 30.0

    def test_handles_none_category(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={
                "income": {"energy": 100.0},
                "expenses": None,
            },
        )
        result = sum_resources_for_snapshot(snapshot)
        assert result["energy"] == 100.0

    def test_initializes_all_resource_fields_to_zero(self) -> None:
        snapshot = BudgetSnapshot(date="2200-01-01", budget={})
        result = sum_resources_for_snapshot(snapshot)
        for field in RESOURCE_FIELDS:
            assert result[field] == 0.0

    def test_handles_missing_resource_in_category(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={"income": {"energy": 100.0}},
        )
        result = sum_resources_for_snapshot(snapshot)
        assert result["energy"] == 100.0
        assert result["minerals"] == 0.0

    def test_sums_all_twenty_resources(self) -> None:
        budget_data = dict.fromkeys(RESOURCE_FIELDS, 1.0)
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={"balance": budget_data},
        )
        result = sum_resources_for_snapshot(snapshot)
        for resource in RESOURCE_FIELDS:
            assert result[resource] == 1.0

    def test_handles_negative_values(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={
                "positive": {"energy": 100.0},
                "negative": {"energy": -150.0},
            },
        )
        result = sum_resources_for_snapshot(snapshot)
        assert result["energy"] == -50.0

    def test_handles_float_precision(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={
                "a": {"energy": 0.1},
                "b": {"energy": 0.2},
            },
        )
        result = sum_resources_for_snapshot(snapshot)
        assert abs(result["energy"] - 0.3) < 1e-9


class TestBuildSystemPrompt:
    def test_contains_drop_threshold(self) -> None:
        prompt = build_system_prompt()
        assert str(int(DROP_THRESHOLD_PERCENT)) in prompt

    def test_contains_analysis_datapoints(self) -> None:
        prompt = build_system_prompt()
        assert str(ANALYSIS_DATAPOINTS) in prompt

    def test_returns_non_empty_string(self) -> None:
        prompt = build_system_prompt()
        assert len(prompt) > 100

    def test_contains_sudden_drop_instructions(self) -> None:
        prompt = build_system_prompt()
        assert "sudden drop" in prompt.lower()

    def test_contains_workflow_section(self) -> None:
        prompt = build_system_prompt()
        assert "Workflow" in prompt


class TestBuildAnalysisPrompt:
    def test_includes_save_filename(self) -> None:
        prompt = build_analysis_prompt("test_save_123")
        assert "test_save_123" in prompt

    def test_includes_datapoint_count(self) -> None:
        prompt = build_analysis_prompt("test_save")
        assert str(ANALYSIS_DATAPOINTS) in prompt

    def test_includes_drop_threshold(self) -> None:
        prompt = build_analysis_prompt("test_save")
        assert str(int(DROP_THRESHOLD_PERCENT)) in prompt

    def test_different_filenames_produce_different_prompts(self) -> None:
        prompt1 = build_analysis_prompt("save_alpha")
        prompt2 = build_analysis_prompt("save_beta")
        assert prompt1 != prompt2
        assert "save_alpha" in prompt1
        assert "save_beta" in prompt2
