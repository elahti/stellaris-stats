from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from pydantic_ai import Agent, NativeOutput
from pydantic_ai.mcp import MCPServerStreamableHTTP
from pydantic_ai.settings import ModelSettings

from agent.models import RootCauseAnalysisResult, SuddenDrop
from agent.multi_agent.root_cause_prompts import (
    build_root_cause_analysis_prompt,
    build_root_cause_system_prompt,
)
from agent.settings import Settings

if TYPE_CHECKING:
    from pydantic_ai.agent import AgentRunResult


@dataclass
class RootCauseAgentDeps:
    graphql_url: str


def get_root_cause_agent(
    mcp_server: MCPServerStreamableHTTP,
    settings: Settings | None = None,
) -> Agent[RootCauseAgentDeps, RootCauseAnalysisResult]:
    if settings is None:
        settings = Settings()
    return Agent(
        "openai:gpt-5.2-2025-12-11",
        deps_type=RootCauseAgentDeps,
        output_type=NativeOutput(RootCauseAnalysisResult),
        system_prompt=build_root_cause_system_prompt(settings.graphql_url),
        toolsets=[mcp_server],
    )


def create_root_cause_deps(settings: Settings | None = None) -> RootCauseAgentDeps:
    if settings is None:
        settings = Settings()
    return RootCauseAgentDeps(graphql_url=settings.graphql_url)


async def run_root_cause_analysis(
    drop: SuddenDrop,
    save_filename: str,
    mcp_server: MCPServerStreamableHTTP,
    deps: RootCauseAgentDeps | None = None,
    model_name: str | None = None,
    model_settings: ModelSettings | None = None,
    settings: Settings | None = None,
) -> AgentRunResult[RootCauseAnalysisResult]:
    if settings is None:
        settings = Settings()
    if deps is None:
        deps = create_root_cause_deps(settings)

    prompt = build_root_cause_analysis_prompt(drop, save_filename, settings.graphql_url)
    agent = get_root_cause_agent(mcp_server, settings)

    if model_name:
        with agent.override(model=model_name):
            return await agent.run(prompt, deps=deps, model_settings=model_settings)
    return await agent.run(prompt, deps=deps, model_settings=model_settings)
