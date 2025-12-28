from __future__ import annotations

import asyncio
from dataclasses import dataclass

from pydantic_ai import Agent, NativeOutput
from pydantic_ai.mcp import MCPServerStreamableHTTP

from agent.models import (
    MultiAgentAnalysisResult,
    SuddenDrop,
    SuddenDropAnalysisResult,
    SuddenDropWithRootCause,
)
from agent.multi_agent.prompts import (
    build_analysis_prompt,
    build_system_prompt,
)
from agent.multi_agent.root_cause_agent import (
    create_root_cause_deps,
    get_root_cause_agent,
    run_root_cause_analysis,
)
from agent.settings import Settings


@dataclass
class SandboxAgentDeps:
    graphql_url: str


def get_drop_detection_agent(
    mcp_server: MCPServerStreamableHTTP,
    settings: Settings | None = None,
) -> Agent[SandboxAgentDeps, SuddenDropAnalysisResult]:
    if settings is None:
        settings = Settings()
    return Agent(
        "openai:gpt-5.2-2025-12-11",
        deps_type=SandboxAgentDeps,
        output_type=NativeOutput(SuddenDropAnalysisResult),
        system_prompt=build_system_prompt(settings.graphql_url),
        toolsets=[mcp_server],
    )


def create_deps(settings: Settings | None = None) -> SandboxAgentDeps:
    if settings is None:
        settings = Settings()
    return SandboxAgentDeps(graphql_url=settings.graphql_url)


async def analyze_single_drop(
    drop: SuddenDrop,
    save_filename: str,
    mcp_server: MCPServerStreamableHTTP,
    settings: Settings,
    model_name: str | None = None,
) -> SuddenDropWithRootCause:
    try:
        result = await run_root_cause_analysis(
            drop=drop,
            save_filename=save_filename,
            mcp_server=mcp_server,
            deps=create_root_cause_deps(settings),
            model_name=model_name,
            settings=settings,
        )
        return SuddenDropWithRootCause(
            drop=drop,
            root_cause=result.output,
            analysis_error=None,
        )
    except Exception as e:
        return SuddenDropWithRootCause(
            drop=drop,
            root_cause=None,
            analysis_error=str(e),
        )


async def run_multi_agent_analysis(
    save_filename: str,
    settings: Settings | None = None,
    model_name: str | None = None,
    parallel_root_cause: bool = False,
) -> MultiAgentAnalysisResult:
    if settings is None:
        settings = Settings()

    # Create a fresh MCP server for each analysis run to avoid stale connection issues
    mcp_server = MCPServerStreamableHTTP(settings.sandbox_url)

    async with mcp_server:
        # Phase 1: Run drop detection agent
        deps = create_deps(settings)
        prompt = build_analysis_prompt(save_filename, deps.graphql_url)
        agent = get_drop_detection_agent(mcp_server, settings)

        if model_name:
            with agent.override(model=model_name):
                drop_result = await agent.run(prompt, deps=deps)
        else:
            drop_result = await agent.run(prompt, deps=deps)

        drop_analysis = drop_result.output

        # Phase 2: Run root cause analysis for each drop
        drops_with_causes: list[SuddenDropWithRootCause] = []

        if drop_analysis.sudden_drops:
            # Initialize the root cause agent with the shared MCP server
            get_root_cause_agent(mcp_server, settings)

            if parallel_root_cause:
                tasks = [
                    analyze_single_drop(
                        drop=drop,
                        save_filename=save_filename,
                        mcp_server=mcp_server,
                        settings=settings,
                        model_name=model_name,
                    )
                    for drop in drop_analysis.sudden_drops
                ]
                drops_with_causes = list(await asyncio.gather(*tasks))
            else:
                for drop in drop_analysis.sudden_drops:
                    result = await analyze_single_drop(
                        drop=drop,
                        save_filename=save_filename,
                        mcp_server=mcp_server,
                        settings=settings,
                        model_name=model_name,
                    )
                    drops_with_causes.append(result)

        # Build final result
        successful_analyses = sum(
            1 for d in drops_with_causes if d.root_cause is not None
        )

        summary_parts = [
            f"Detected {len(drop_analysis.sudden_drops)} sudden drop(s).",
        ]

        if drop_analysis.sudden_drops:
            summary_parts.append(
                f"Successfully analyzed root causes for {successful_analyses}.",
            )
            resources = [d.drop.resource for d in drops_with_causes]
            summary_parts.append(f"Resources affected: {', '.join(resources)}")
        else:
            summary_parts.append("No drops to analyze.")

        return MultiAgentAnalysisResult(
            save_filename=save_filename,
            analysis_period_start=drop_analysis.analysis_period_start,
            analysis_period_end=drop_analysis.analysis_period_end,
            datapoints_analyzed=drop_analysis.datapoints_analyzed,
            drop_threshold_percent=drop_analysis.drop_threshold_percent,
            drops_with_root_causes=drops_with_causes,
            total_drops_detected=len(drop_analysis.sudden_drops),
            successful_root_cause_analyses=successful_analyses,
            summary=" ".join(summary_parts),
        )
