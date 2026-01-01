from agent.models import SuddenDrop
from agent.root_cause_multi_agent.prompts import BUDGET_CATEGORIES
from agent.root_cause_multi_agent.root_cause_prompts import (
    build_root_cause_analysis_prompt,
    build_root_cause_system_prompt,
)


class TestBuildRootCauseSystemPrompt:
    def test_contains_graphql_url(self) -> None:
        url = "http://localhost:4000/graphql"
        prompt = build_root_cause_system_prompt(url)
        assert url in prompt

    def test_contains_task_description(self) -> None:
        prompt = build_root_cause_system_prompt("http://example.com")

        assert "root cause" in prompt.lower()
        assert "TOP 3" in prompt

    def test_contains_workflow(self) -> None:
        prompt = build_root_cause_system_prompt("http://example.com")

        assert "Workflow" in prompt
        assert "run_python_code" in prompt

    def test_contains_income_expenses_query(self) -> None:
        prompt = build_root_cause_system_prompt("http://example.com")

        assert "GetIncomeExpenses" in prompt
        assert "income" in prompt
        assert "expenses" in prompt

    def test_contains_budget_categories(self) -> None:
        prompt = build_root_cause_system_prompt("http://example.com")

        assert len(BUDGET_CATEGORIES) > 0
        for category in BUDGET_CATEGORIES[:5]:
            assert category in prompt

    def test_contains_analysis_algorithm(self) -> None:
        prompt = build_root_cause_system_prompt("http://example.com")

        assert "income_decreased" in prompt
        assert "expenses_increased" in prompt
        assert "impact" in prompt

    def test_contains_output_format(self) -> None:
        prompt = build_root_cause_system_prompt("http://example.com")

        assert "top_contributors" in prompt
        assert "contributor_type" in prompt
        assert "rank" in prompt
        assert "explanation" in prompt

    def test_contains_critical_rules(self) -> None:
        prompt = build_root_cause_system_prompt("http://example.com")

        assert "CRITICAL" in prompt
        assert "JSON" in prompt
        assert "httpx" in prompt


class TestBuildRootCauseAnalysisPrompt:
    def test_contains_drop_resource(self) -> None:
        drop = _create_sample_drop("energy")
        prompt = build_root_cause_analysis_prompt(
            drop,
            "test.sav",
            "http://example.com",
        )
        assert "energy" in prompt

    def test_contains_save_filename(self) -> None:
        drop = _create_sample_drop("minerals")
        prompt = build_root_cause_analysis_prompt(
            drop,
            "my-empire.sav",
            "http://example.com",
        )
        assert "my-empire.sav" in prompt

    def test_contains_drop_dates(self) -> None:
        drop = _create_sample_drop("energy")
        prompt = build_root_cause_analysis_prompt(
            drop,
            "test.sav",
            "http://example.com",
        )

        assert drop.start_date in prompt
        assert drop.end_date in prompt

    def test_contains_drop_values(self) -> None:
        drop = _create_sample_drop("energy")
        prompt = build_root_cause_analysis_prompt(
            drop,
            "test.sav",
            "http://example.com",
        )

        assert f"{drop.drop_percent:.1f}%" in prompt

    def test_contains_graphql_url(self) -> None:
        drop = _create_sample_drop("energy")
        url = "http://localhost:4000/graphql"
        prompt = build_root_cause_analysis_prompt(drop, "test.sav", url)
        assert url in prompt

    def test_contains_instructions(self) -> None:
        drop = _create_sample_drop("energy")
        prompt = build_root_cause_analysis_prompt(
            drop,
            "test.sav",
            "http://example.com",
        )

        assert "income" in prompt.lower()
        assert "expenses" in prompt.lower()
        assert "TOP 3" in prompt
        assert "income_decreased" in prompt
        assert "expenses_increased" in prompt


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
