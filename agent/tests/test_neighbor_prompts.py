from agent.neighbor_multi.prompts import (
    build_neighbor_detection_prompt,
    build_neighbor_detection_system_prompt,
    build_opinion_analysis_prompt,
    build_opinion_analysis_system_prompt,
)
from agent.neighbor_single.prompts import (
    build_analysis_prompt,
    build_system_prompt,
)


class TestBuildSystemPrompt:
    def test_contains_graphql_url(self) -> None:
        url = "http://localhost:4000/graphql"
        prompt = build_system_prompt(url)
        assert url in prompt

    def test_contains_graphql_query(self) -> None:
        prompt = build_system_prompt("http://example.com")

        assert "GetNeighborData" in prompt
        assert "playerEmpire" in prompt
        assert "ownedPlanetIds" in prompt
        assert "diplomaticRelations" in prompt
        assert "allPlanetCoordinates" in prompt

    def test_contains_workflow_instructions(self) -> None:
        prompt = build_system_prompt("http://example.com")

        assert "Workflow" in prompt
        assert "run_python_code" in prompt

    def test_contains_distance_algorithm(self) -> None:
        prompt = build_system_prompt("http://example.com")

        assert "min_distance" in prompt
        assert "sqrt" in prompt
        assert "player_planet_ids" in prompt
        assert "target_planet_ids" in prompt

    def test_contains_finding_types(self) -> None:
        prompt = build_system_prompt("http://example.com")

        assert "hostile_neighbor" in prompt
        assert "genocidal_reputation" in prompt
        assert "low_opinion" in prompt
        assert "high_threat" in prompt

    def test_contains_finding_thresholds(self) -> None:
        prompt = build_system_prompt("http://example.com")

        assert "isHostile=true" in prompt
        assert "-50" in prompt
        assert "50" in prompt
        assert "genocidal" in prompt

    def test_contains_finding_severities(self) -> None:
        prompt = build_system_prompt("http://example.com")

        assert "CRITICAL" in prompt
        assert "WARNING" in prompt
        assert "INFO" in prompt

    def test_contains_output_format(self) -> None:
        prompt = build_system_prompt("http://example.com")

        assert "neighbors" in prompt
        assert "key_findings" in prompt
        assert "summary" in prompt
        assert "save_filename" in prompt
        assert "analysis_date" in prompt
        assert "player_empire_name" in prompt

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

        assert "neighbor" in prompt.lower()
        assert "JSON" in prompt


class TestBuildNeighborDetectionSystemPrompt:
    def test_contains_graphql_url(self) -> None:
        url = "http://localhost:4000/graphql"
        prompt = build_neighbor_detection_system_prompt(url)
        assert url in prompt

    def test_contains_graphql_query(self) -> None:
        prompt = build_neighbor_detection_system_prompt("http://example.com")

        assert "GetNeighborData" in prompt
        assert "playerEmpire" in prompt
        assert "ownedPlanetIds" in prompt
        assert "allPlanetCoordinates" in prompt

    def test_contains_workflow_instructions(self) -> None:
        prompt = build_neighbor_detection_system_prompt("http://example.com")

        assert "run_python_code" in prompt

    def test_contains_distance_calculation(self) -> None:
        prompt = build_neighbor_detection_system_prompt("http://example.com")

        assert "min_distance" in prompt
        assert "sqrt" in prompt
        assert "player_planet_ids" in prompt
        assert "target_planet_ids" in prompt

    def test_contains_output_format(self) -> None:
        prompt = build_neighbor_detection_system_prompt("http://example.com")

        assert "detected_neighbors" in prompt
        assert "save_filename" in prompt
        assert "country_id" in prompt


class TestBuildNeighborDetectionPrompt:
    def test_contains_save_filename(self) -> None:
        prompt = build_neighbor_detection_prompt("my-empire.sav", "http://example.com")
        assert "my-empire.sav" in prompt

    def test_contains_graphql_url(self) -> None:
        url = "http://localhost:4000/graphql"
        prompt = build_neighbor_detection_prompt("test.sav", url)
        assert url in prompt


class TestBuildOpinionAnalysisSystemPrompt:
    def test_contains_graphql_url(self) -> None:
        url = "http://localhost:4000/graphql"
        prompt = build_opinion_analysis_system_prompt(url)
        assert url in prompt

    def test_contains_graphql_query(self) -> None:
        prompt = build_opinion_analysis_system_prompt("http://example.com")

        assert "GetDiplomaticData" in prompt
        assert "diplomaticRelations" in prompt
        assert "opinionModifiers" in prompt

    def test_contains_finding_types(self) -> None:
        prompt = build_opinion_analysis_system_prompt("http://example.com")

        assert "hostile_neighbor" in prompt
        assert "genocidal_reputation" in prompt
        assert "low_opinion" in prompt
        assert "high_threat" in prompt

    def test_contains_finding_thresholds(self) -> None:
        prompt = build_opinion_analysis_system_prompt("http://example.com")

        assert "isHostile=true" in prompt
        assert "-50" in prompt
        assert "50" in prompt
        assert "genocidal" in prompt

    def test_contains_output_format(self) -> None:
        prompt = build_opinion_analysis_system_prompt("http://example.com")

        assert "findings" in prompt
        assert "opinion_modifiers" in prompt
        assert "is_hostile" in prompt


class TestBuildOpinionAnalysisPrompt:
    def test_contains_save_filename(self) -> None:
        prompt = build_opinion_analysis_prompt(
            "my-empire.sav",
            "1",
            "Test Empire",
            "http://example.com",
        )
        assert "my-empire.sav" in prompt

    def test_contains_target_info(self) -> None:
        prompt = build_opinion_analysis_prompt(
            "test.sav",
            "42",
            "Blorg Commonality",
            "http://example.com",
        )
        assert "Blorg Commonality" in prompt
        assert "42" in prompt

    def test_contains_graphql_url(self) -> None:
        url = "http://localhost:4000/graphql"
        prompt = build_opinion_analysis_prompt("test.sav", "1", "Empire", url)
        assert url in prompt
