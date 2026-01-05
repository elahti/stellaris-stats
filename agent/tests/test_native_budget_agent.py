from agent.native_budget.agent import (
    ANALYSIS_DATAPOINTS,
    DROP_THRESHOLD_PERCENT,
    RESOURCE_FIELDS,
    build_analysis_prompt,
    build_system_prompt,
    sum_resources_for_snapshot,
)
from agent.native_budget.models import BudgetSnapshot


class TestSumResourcesForSnapshot:
    def test_sums_resources_across_categories(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={
                "countryBase": {"energy": 100.0, "minerals": 50.0},
                "ships": {"energy": -20.0, "minerals": -10.0},
            },
        )

        result = sum_resources_for_snapshot(snapshot)

        assert result["energy"] == 80.0
        assert result["minerals"] == 40.0

    def test_handles_none_category(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={
                "countryBase": {"energy": 100.0},
                "ships": None,
            },
        )

        result = sum_resources_for_snapshot(snapshot)
        assert result["energy"] == 100.0

    def test_handles_missing_resources(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={
                "countryBase": {"energy": 100.0},
            },
        )

        result = sum_resources_for_snapshot(snapshot)
        assert result["energy"] == 100.0
        assert result["minerals"] == 0.0
        assert result["alloys"] == 0.0

    def test_handles_empty_budget(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={},
        )

        result = sum_resources_for_snapshot(snapshot)

        for resource in RESOURCE_FIELDS:
            assert result[resource] == 0.0

    def test_all_resource_fields_are_present(self) -> None:
        snapshot = BudgetSnapshot(date="2200-01-01", budget={})
        result = sum_resources_for_snapshot(snapshot)

        assert len(result) == len(RESOURCE_FIELDS)
        for field in RESOURCE_FIELDS:
            assert field in result

    def test_sums_multiple_categories_with_same_resource(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={
                "colonies": {"energy": 50.0},
                "ships": {"energy": -10.0},
                "starbases": {"energy": -5.0},
                "tradePolicy": {"energy": 30.0},
            },
        )

        result = sum_resources_for_snapshot(snapshot)
        assert result["energy"] == 65.0


class TestBuildSystemPrompt:
    def test_contains_workflow_instructions(self) -> None:
        prompt = build_system_prompt()

        assert "Workflow" in prompt
        assert "get_available_saves" in prompt
        assert "get_budget_time_series" in prompt

    def test_contains_drop_threshold(self) -> None:
        prompt = build_system_prompt()
        assert f"{DROP_THRESHOLD_PERCENT}%" in prompt

    def test_contains_analysis_datapoints(self) -> None:
        prompt = build_system_prompt()
        assert str(ANALYSIS_DATAPOINTS) in prompt

    def test_contains_sudden_drop_detection_logic(self) -> None:
        prompt = build_system_prompt()

        assert "Sudden Drop Detection" in prompt
        assert "drop_percent" in prompt
        assert "consecutive" in prompt.lower()

    def test_contains_edge_cases(self) -> None:
        prompt = build_system_prompt()

        assert "Edge Cases" in prompt
        assert "0" in prompt

    def test_contains_stellaris_context(self) -> None:
        prompt = build_system_prompt()

        assert "Stellaris" in prompt
        assert "budget" in prompt.lower()


class TestBuildAnalysisPrompt:
    def test_contains_save_filename(self) -> None:
        prompt = build_analysis_prompt("test-empire.sav")
        assert "test-empire.sav" in prompt

    def test_contains_drop_threshold(self) -> None:
        prompt = build_analysis_prompt("test.sav")
        assert f"{DROP_THRESHOLD_PERCENT}%" in prompt

    def test_contains_analysis_instructions(self) -> None:
        prompt = build_analysis_prompt("test.sav")

        assert "get_budget_time_series" in prompt
        assert "consecutive" in prompt.lower()
        assert "sudden drops" in prompt.lower()

    def test_contains_datapoints_count(self) -> None:
        prompt = build_analysis_prompt("test.sav")
        assert str(ANALYSIS_DATAPOINTS) in prompt


class TestResourceFields:
    def test_has_expected_resources(self) -> None:
        expected = [
            "energy",
            "minerals",
            "alloys",
            "food",
            "consumerGoods",
            "influence",
            "unity",
            "trade",
        ]
        for resource in expected:
            assert resource in RESOURCE_FIELDS

    def test_has_research_resources(self) -> None:
        assert "physicsResearch" in RESOURCE_FIELDS
        assert "societyResearch" in RESOURCE_FIELDS
        assert "engineeringResearch" in RESOURCE_FIELDS

    def test_has_strategic_resources(self) -> None:
        strategic = [
            "exoticGases",
            "rareCrystals",
            "volatileMotes",
            "srDarkMatter",
            "srLivingMetal",
            "srZro",
            "nanites",
            "minorArtifacts",
            "astralThreads",
        ]
        for resource in strategic:
            assert resource in RESOURCE_FIELDS

    def test_has_twenty_resource_fields(self) -> None:
        assert len(RESOURCE_FIELDS) == 20
