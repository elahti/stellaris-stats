from __future__ import annotations

from dataclasses import dataclass

from pydantic_ai import Agent
from pydantic_ai.mcp import MCPServerStreamableHTTP

from agent.constants import DEFAULT_MODEL, get_model, wrap_output_type
from agent.neighbor import NeighborAnalysisResult
from agent.neighbor_single.prompts import (
    build_analysis_prompt,
    build_system_prompt,
)
from agent.settings import Settings, get_settings


@dataclass
class NeighborSingleAgentDeps:
    """Dependencies for the neighbor analysis single agent."""

    graphql_url: str


def get_single_agent(
    mcp_server: MCPServerStreamableHTTP,
    model_name: str,
    settings: Settings | None = None,
) -> Agent[NeighborSingleAgentDeps, NeighborAnalysisResult]:
    if settings is None:
        settings = get_settings()
    return Agent(
        get_model(model_name),
        deps_type=NeighborSingleAgentDeps,
        output_type=wrap_output_type(NeighborAnalysisResult),
        system_prompt=build_system_prompt(settings.graphql_url),
        toolsets=[mcp_server],
        name="neighbor_single_agent",
    )


def create_deps(settings: Settings | None = None) -> NeighborSingleAgentDeps:
    if settings is None:
        settings = get_settings()
    return NeighborSingleAgentDeps(graphql_url=settings.graphql_url)


class NeighborAnalysisError(Exception):
    """Raised when neighbor analysis fails."""


async def run_neighbor_single_agent_analysis(
    save_filename: str,
    settings: Settings | None = None,
    model_name: str | None = None,
) -> NeighborAnalysisResult:
    if settings is None:
        settings = get_settings()

    actual_model = model_name or DEFAULT_MODEL

    mcp_server = MCPServerStreamableHTTP(settings.sandbox_url)

    try:
        async with mcp_server:
            deps = create_deps(settings)
            prompt = build_analysis_prompt(save_filename, deps.graphql_url)
            agent = get_single_agent(mcp_server, actual_model, settings)

            result = await agent.run(
                prompt,
                deps=deps,
            )

            return result.output
    except Exception as e:
        raise NeighborAnalysisError(
            f"Failed to analyze neighbors for save '{save_filename}': {e}",
        ) from e
