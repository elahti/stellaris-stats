from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from pydantic_ai import Agent
from pydantic_ai.mcp import MCPServerStreamableHTTP

from agent.constants import DEFAULT_MODEL, get_model, wrap_output_type
from agent.models import SuddenDropAnalysisResult
from agent.sandbox.prompts import (
    build_analysis_prompt,
    build_system_prompt,
)
from agent.settings import Settings, get_settings

if TYPE_CHECKING:
    from pydantic_ai.agent import AgentRunResult


@dataclass
class SandboxDropDetectionDeps:
    graphql_url: str


def get_sandbox_drop_detection_agent(
    mcp_server: MCPServerStreamableHTTP,
    model_name: str,
    settings: Settings | None = None,
) -> Agent[SandboxDropDetectionDeps, SuddenDropAnalysisResult]:
    if settings is None:
        settings = get_settings()
    return Agent(
        get_model(model_name),
        deps_type=SandboxDropDetectionDeps,
        output_type=wrap_output_type(SuddenDropAnalysisResult),
        system_prompt=build_system_prompt(settings.graphql_url),
        toolsets=[mcp_server],
        name="sandbox_drop_detection_agent",
    )


def create_deps(settings: Settings | None = None) -> SandboxDropDetectionDeps:
    if settings is None:
        settings = get_settings()
    return SandboxDropDetectionDeps(graphql_url=settings.graphql_url)


async def run_sandbox_drop_detection_analysis(
    save_filename: str,
    deps: SandboxDropDetectionDeps | None = None,
    model_name: str | None = None,
    settings: Settings | None = None,
) -> AgentRunResult[SuddenDropAnalysisResult]:
    if settings is None:
        settings = get_settings()
    if deps is None:
        deps = create_deps(settings)

    prompt = build_analysis_prompt(save_filename, deps.graphql_url)
    actual_model = model_name or DEFAULT_MODEL

    # Create a fresh MCP server for each analysis run to avoid stale connection issues
    mcp_server = MCPServerStreamableHTTP(settings.sandbox_url)

    async with mcp_server:
        agent = get_sandbox_drop_detection_agent(
            mcp_server,
            actual_model,
            settings,
        )
        return await agent.run(prompt, deps=deps)
