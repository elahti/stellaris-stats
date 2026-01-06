from __future__ import annotations

from dataclasses import dataclass

from pydantic_ai import Agent
from pydantic_ai.mcp import MCPServerStreamableHTTP

from agent.constants import DEFAULT_MODEL, get_model, wrap_output_type
from agent.neighbor import (
    KeyFinding,
    NeighborAnalysisResult,
    NeighborInfo,
    OpinionModifier,
)
from agent.neighbor_multi.models import (
    DetectedNeighbor,
    NeighborDetectionResult,
    OpinionAnalysisResult,
)
from agent.neighbor_multi.prompts import (
    build_neighbor_detection_prompt,
    build_neighbor_detection_system_prompt,
    build_opinion_analysis_prompt,
    build_opinion_analysis_system_prompt,
)
from agent.settings import Settings, get_settings

AnalysisResultTuple = tuple[DetectedNeighbor, OpinionAnalysisResult | None, str | None]


@dataclass
class NeighborMultiAgentDeps:
    """Dependencies for the multi-agent neighbor analysis orchestration."""

    graphql_url: str


def get_neighbor_detection_agent(
    mcp_server: MCPServerStreamableHTTP,
    model_name: str,
    settings: Settings | None = None,
) -> Agent[NeighborMultiAgentDeps, NeighborDetectionResult]:
    if settings is None:
        settings = get_settings()
    return Agent(
        get_model(model_name),
        deps_type=NeighborMultiAgentDeps,
        output_type=wrap_output_type(NeighborDetectionResult),
        system_prompt=build_neighbor_detection_system_prompt(settings.graphql_url),
        toolsets=[mcp_server],
        name="neighbor_detection_agent",
    )


def get_opinion_analysis_agent(
    mcp_server: MCPServerStreamableHTTP,
    model_name: str,
    settings: Settings | None = None,
) -> Agent[NeighborMultiAgentDeps, OpinionAnalysisResult]:
    if settings is None:
        settings = get_settings()
    return Agent(
        get_model(model_name),
        deps_type=NeighborMultiAgentDeps,
        output_type=wrap_output_type(OpinionAnalysisResult),
        system_prompt=build_opinion_analysis_system_prompt(settings.graphql_url),
        toolsets=[mcp_server],
        name="opinion_analysis_agent",
    )


def create_deps(settings: Settings | None = None) -> NeighborMultiAgentDeps:
    if settings is None:
        settings = get_settings()
    return NeighborMultiAgentDeps(graphql_url=settings.graphql_url)


async def analyze_single_neighbor(
    neighbor: DetectedNeighbor,
    save_filename: str,
    mcp_server: MCPServerStreamableHTTP,
    deps: NeighborMultiAgentDeps,
    model_name: str,
    settings: Settings,
) -> tuple[DetectedNeighbor, OpinionAnalysisResult | None, str | None]:
    try:
        agent = get_opinion_analysis_agent(mcp_server, model_name, settings)
        prompt = build_opinion_analysis_prompt(
            save_filename,
            neighbor.country_id,
            neighbor.name,
            deps.graphql_url,
        )
        result = await agent.run(prompt, deps=deps)
        return (neighbor, result.output, None)
    except Exception as e:
        return (neighbor, None, str(e))


async def run_neighbor_multi_agent_orchestration(
    save_filename: str,
    settings: Settings | None = None,
    model_name: str | None = None,
) -> NeighborAnalysisResult:
    if settings is None:
        settings = get_settings()

    actual_model = model_name or DEFAULT_MODEL

    mcp_server = MCPServerStreamableHTTP(settings.sandbox_url)

    async with mcp_server:
        # Phase 1: Run neighbor detection agent
        deps = create_deps(settings)
        prompt = build_neighbor_detection_prompt(save_filename, deps.graphql_url)
        detection_agent = get_neighbor_detection_agent(
            mcp_server,
            actual_model,
            settings,
        )

        detection_result = await detection_agent.run(prompt, deps=deps)
        detection = detection_result.output

        # Phase 2: Run opinion analysis for each neighbor
        neighbors: list[NeighborInfo] = []
        all_findings: list[KeyFinding] = []

        results: list[AnalysisResultTuple] = []
        for neighbor in detection.detected_neighbors:
            result = await analyze_single_neighbor(
                neighbor=neighbor,
                save_filename=save_filename,
                mcp_server=mcp_server,
                deps=deps,
                model_name=actual_model,
                settings=settings,
            )
            results.append(result)

        for neighbor, opinion_result, _error in results:
            if opinion_result:
                neighbors.append(
                    NeighborInfo(
                        country_id=neighbor.country_id,
                        name=neighbor.name,
                        min_distance=neighbor.min_distance,
                        owned_planet_count=neighbor.owned_planet_count,
                        opinion=opinion_result.opinion,
                        trust=opinion_result.trust,
                        threat=opinion_result.threat,
                        is_hostile=opinion_result.is_hostile,
                        opinion_modifiers=[
                            OpinionModifier(
                                modifier_type=m.modifier_type,
                                value=m.value,
                            )
                            for m in opinion_result.opinion_modifiers
                        ],
                    ),
                )
                all_findings.extend(
                    KeyFinding(
                        finding_type=finding.finding_type,
                        description=finding.description,
                        severity=finding.severity,
                    )
                    for finding in opinion_result.findings
                )
            else:
                neighbors.append(
                    NeighborInfo(
                        country_id=neighbor.country_id,
                        name=neighbor.name,
                        min_distance=neighbor.min_distance,
                        owned_planet_count=neighbor.owned_planet_count,
                        opinion=None,
                        trust=None,
                        threat=None,
                        is_hostile=None,
                        opinion_modifiers=[],
                    ),
                )

        # Build summary
        summary_parts: list[str] = []
        if neighbors:
            closest = neighbors[0]
            opinion_str = (
                f"with {closest.opinion:+.0f} opinion"
                if closest.opinion is not None
                else ""
            )
            summary_parts.append(
                f"Your closest neighbor is {closest.name} at {closest.min_distance:.1f} distance {opinion_str}.",
            )

        hostile_count = sum(1 for n in neighbors if n.is_hostile)
        if hostile_count > 0:
            summary_parts.append(
                f"You have {hostile_count} hostile neighbor(s) that pose a threat.",
            )

        if not summary_parts:
            summary_parts.append("No neighbors detected with owned planets.")

        return NeighborAnalysisResult(
            save_filename=save_filename,
            analysis_date=detection.analysis_date,
            player_empire_name=detection.player_empire_name,
            player_owned_planets=detection.player_owned_planets,
            neighbors=neighbors,
            key_findings=all_findings,
            summary=" ".join(summary_parts),
        )
