from agent.sandbox_drop_detection.prompts import (
    ANALYSIS_DATAPOINTS,
    BUDGET_CATEGORIES,
    DROP_THRESHOLD_PERCENT,
    RESOURCE_FIELDS,
    build_analysis_prompt,
    build_system_prompt,
)


class TestBuildSystemPrompt:
    def test_contains_graphql_url(self) -> None:
        url = "http://localhost:4000/graphql"
        prompt = build_system_prompt(url)
        assert url in prompt

    def test_contains_workflow_instructions(self) -> None:
        prompt = build_system_prompt("http://example.com")

        assert "Workflow" in prompt
        assert "run_python_code" in prompt

    def test_contains_graphql_queries(self) -> None:
        prompt = build_system_prompt("http://example.com")

        assert "GetDates" in prompt
        assert "GetBudget" in prompt
        assert "query" in prompt

    def test_contains_budget_category_fields(self) -> None:
        prompt = build_system_prompt("http://example.com")

        for category in BUDGET_CATEGORIES[:5]:
            assert category in prompt

    def test_contains_resource_fields(self) -> None:
        prompt = build_system_prompt("http://example.com")

        for resource in RESOURCE_FIELDS[:5]:
            assert resource in prompt

    def test_contains_drop_threshold(self) -> None:
        prompt = build_system_prompt("http://example.com")
        assert f"{DROP_THRESHOLD_PERCENT}%" in prompt

    def test_contains_analysis_datapoints(self) -> None:
        prompt = build_system_prompt("http://example.com")
        assert str(ANALYSIS_DATAPOINTS) in prompt

    def test_contains_output_format(self) -> None:
        prompt = build_system_prompt("http://example.com")

        assert "sudden_drops" in prompt
        assert "save_filename" in prompt
        assert "summary" in prompt

    def test_contains_critical_rules(self) -> None:
        prompt = build_system_prompt("http://example.com")

        assert "CRITICAL" in prompt
        assert "JSON" in prompt

    def test_contains_httpx_instruction(self) -> None:
        prompt = build_system_prompt("http://example.com")
        assert "httpx" in prompt


class TestBuildAnalysisPrompt:
    def test_contains_save_filename(self) -> None:
        prompt = build_analysis_prompt("my-empire.sav", "http://example.com")
        assert "my-empire.sav" in prompt

    def test_contains_graphql_url(self) -> None:
        url = "http://localhost:4000/graphql"
        prompt = build_analysis_prompt("test.sav", url)
        assert url in prompt

    def test_contains_analysis_instructions(self) -> None:
        prompt = build_analysis_prompt("test.sav", "http://example.com")

        assert str(ANALYSIS_DATAPOINTS) in prompt
        assert f"{DROP_THRESHOLD_PERCENT}%" in prompt

    def test_contains_json_instruction(self) -> None:
        prompt = build_analysis_prompt("test.sav", "http://example.com")
        assert "JSON" in prompt


class TestBudgetCategories:
    def test_has_expected_count(self) -> None:
        assert len(BUDGET_CATEGORIES) == 75

    def test_contains_core_categories(self) -> None:
        expected = [
            "armies",
            "colonies",
            "ships",
            "starbases",
            "countryBase",
            "tradePolicy",
        ]
        for category in expected:
            assert category in BUDGET_CATEGORIES

    def test_contains_planet_categories(self) -> None:
        planet_categories = [c for c in BUDGET_CATEGORIES if c.startswith("planet")]
        assert len(planet_categories) > 10

    def test_contains_megastructure_categories(self) -> None:
        mega_categories = [
            c for c in BUDGET_CATEGORIES if c.startswith("megastructure")
        ]
        assert len(mega_categories) >= 4

    def test_all_categories_are_camel_case(self) -> None:
        for category in BUDGET_CATEGORIES:
            assert category[0].islower()
            assert "_" not in category


class TestResourceFields:
    def test_has_twenty_fields(self) -> None:
        assert len(RESOURCE_FIELDS) == 20

    def test_all_fields_are_camel_case(self) -> None:
        for field in RESOURCE_FIELDS:
            assert field[0].islower()
            assert "_" not in field
