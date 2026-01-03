from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from pydantic_ai import Agent
from pydantic_ai.mcp import MCPServerStreamableHTTP

from agent.constants import DEFAULT_MODEL, get_model, wrap_output_type
from agent.models import RootCauseAnalysisResult, SuddenDrop
from agent.root_cause_multi_agent.root_cause_prompts import (
    build_root_cause_analysis_prompt,
    build_root_cause_system_prompt,
)
from agent.settings import Settings, get_settings

if TYPE_CHECKING:
    from pydantic_ai.agent import AgentRunResult


@dataclass
class RootCauseAgentDeps:
    graphql_url: str


def get_root_cause_agent(
    mcp_server: MCPServerStreamableHTTP,
    model_name: str,
    settings: Settings | None = None,
) -> Agent[RootCauseAgentDeps, RootCauseAnalysisResult]:
    if settings is None:
        settings = get_settings()
    return Agent(
        get_model(model_name),
        deps_type=RootCauseAgentDeps,
        output_type=wrap_output_type(RootCauseAnalysisResult),
        system_prompt=build_root_cause_system_prompt(settings.graphql_url),
        toolsets=[mcp_server],
    )


def create_root_cause_deps(settings: Settings | None = None) -> RootCauseAgentDeps:
    if settings is None:
        settings = get_settings()
    return RootCauseAgentDeps(graphql_url=settings.graphql_url)


async def run_root_cause_analysis(
    drop: SuddenDrop,
    save_filename: str,
    mcp_server: MCPServerStreamableHTTP,
    deps: RootCauseAgentDeps | None = None,
    model_name: str | None = None,
    settings: Settings | None = None,
) -> AgentRunResult[RootCauseAnalysisResult]:
    if settings is None:
        settings = get_settings()
    if deps is None:
        deps = create_root_cause_deps(settings)

    actual_model = model_name or DEFAULT_MODEL
    prompt = build_root_cause_analysis_prompt(drop, save_filename, settings.graphql_url)
    agent = get_root_cause_agent(mcp_server, actual_model, settings)

    return await agent.run(prompt, deps=deps)
