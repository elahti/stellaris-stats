from __future__ import annotations

from dataclasses import dataclass

from pydantic_ai import Agent, NativeOutput
from pydantic_ai.mcp import MCPServerStreamableHTTP
from pydantic_ai.settings import ModelSettings

from agent.constants import DEFAULT_MODEL, get_model
from agent.models import MultiAgentAnalysisResult
from agent.root_cause_single_agent.prompts import (
    build_analysis_prompt,
    build_system_prompt,
)
from agent.settings import Settings, get_settings


@dataclass
class RootCauseSingleAgentDeps:
    graphql_url: str


_single_agent: Agent[RootCauseSingleAgentDeps, MultiAgentAnalysisResult] | None = None


def get_single_agent(
    mcp_server: MCPServerStreamableHTTP,
    settings: Settings | None = None,
) -> Agent[RootCauseSingleAgentDeps, MultiAgentAnalysisResult]:
    global _single_agent
    if _single_agent is None:
        if settings is None:
            settings = get_settings()
        _single_agent = Agent(
            get_model(DEFAULT_MODEL),
            deps_type=RootCauseSingleAgentDeps,
            output_type=NativeOutput(MultiAgentAnalysisResult),
            system_prompt=build_system_prompt(settings.graphql_url),
            toolsets=[mcp_server],
        )
    return _single_agent


def create_deps(settings: Settings | None = None) -> RootCauseSingleAgentDeps:
    if settings is None:
        settings = get_settings()
    return RootCauseSingleAgentDeps(graphql_url=settings.graphql_url)


async def run_root_cause_single_agent_analysis(
    save_filename: str,
    settings: Settings | None = None,
    model_name: str | None = None,
    model_settings: ModelSettings | None = None,
) -> MultiAgentAnalysisResult:
    if settings is None:
        settings = get_settings()

    # Create a fresh MCP server for each analysis run to avoid stale connection issues
    mcp_server = MCPServerStreamableHTTP(settings.sandbox_url)

    async with mcp_server:
        # Run single agent that does both drop detection and root cause analysis
        deps = create_deps(settings)
        prompt = build_analysis_prompt(save_filename, deps.graphql_url)
        agent = get_single_agent(mcp_server, settings)

        if model_name:
            with agent.override(model=get_model(model_name)):
                result = await agent.run(
                    prompt,
                    deps=deps,
                    model_settings=model_settings,
                )
        else:
            result = await agent.run(
                prompt,
                deps=deps,
                model_settings=model_settings,
            )

        return result.output
