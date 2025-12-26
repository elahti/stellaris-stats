from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from pydantic_ai import Agent, NativeOutput
from pydantic_ai.mcp import MCPServerStreamableHTTP

from agent.budget_agent.models import SuddenDropAnalysisResult
from agent.sandbox_budget_agent.prompts import (
    build_analysis_prompt,
    build_system_prompt,
)
from agent.settings import Settings

if TYPE_CHECKING:
    from pydantic_ai.agent import AgentRunResult


@dataclass
class SandboxAgentDeps:
    graphql_url: str


_sandbox_budget_agent: Agent[SandboxAgentDeps, SuddenDropAnalysisResult] | None = None
_mcp_server: MCPServerStreamableHTTP | None = None


def get_mcp_server(settings: Settings | None = None) -> MCPServerStreamableHTTP:
    global _mcp_server
    if _mcp_server is None:
        if settings is None:
            settings = Settings()
        _mcp_server = MCPServerStreamableHTTP(settings.sandbox_url)
    return _mcp_server


def get_sandbox_budget_agent(
    settings: Settings | None = None,
) -> Agent[SandboxAgentDeps, SuddenDropAnalysisResult]:
    global _sandbox_budget_agent
    if _sandbox_budget_agent is None:
        if settings is None:
            settings = Settings()
        server = get_mcp_server(settings)
        _sandbox_budget_agent = Agent(
            "openai:gpt-5.2-2025-12-11",
            deps_type=SandboxAgentDeps,
            output_type=NativeOutput(SuddenDropAnalysisResult),
            system_prompt=build_system_prompt(settings.graphql_url),
            toolsets=[server],
        )
    return _sandbox_budget_agent


def create_deps(settings: Settings | None = None) -> SandboxAgentDeps:
    if settings is None:
        settings = Settings()
    return SandboxAgentDeps(graphql_url=settings.graphql_url)


async def run_sandbox_budget_analysis(
    save_filename: str,
    deps: SandboxAgentDeps | None = None,
    model_name: str | None = None,
    settings: Settings | None = None,
) -> AgentRunResult[SuddenDropAnalysisResult]:
    if settings is None:
        settings = Settings()
    if deps is None:
        deps = create_deps(settings)

    prompt = build_analysis_prompt(save_filename, deps.graphql_url)
    agent = get_sandbox_budget_agent(settings)

    async with get_mcp_server(settings):
        if model_name:
            with agent.override(model=model_name):
                return await agent.run(prompt, deps=deps)
        return await agent.run(prompt, deps=deps)
