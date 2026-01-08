from __future__ import annotations

from dataclasses import dataclass

from pydantic_ai import Agent
from pydantic_ai.mcp import MCPServerStreamableHTTP

from agent.constants import DEFAULT_MODEL, create_model, wrap_output_type
from agent.models import (
    MultiAgentAnalysisResult,
    SuddenDrop,
    SuddenDropAnalysisResult,
    SuddenDropWithRootCause,
)
from agent.root_cause_multi.prompts import (
    build_analysis_prompt,
    build_system_prompt,
)
from agent.root_cause_multi.root_cause_agent import (
    create_root_cause_deps,
    run_root_cause_analysis,
)
from agent.settings import (
    MCP_TIMEOUT_SECONDS,
    Settings,
    create_resilient_http_client,
    get_settings,
)


@dataclass
class RootCauseMultiAgentDeps:
    graphql_url: str


def create_drop_detection_agent(
    mcp_server: MCPServerStreamableHTTP,
    model_name: str,
    settings: Settings | None = None,
) -> Agent[RootCauseMultiAgentDeps, SuddenDropAnalysisResult]:
    if settings is None:
        settings = get_settings()
    return Agent(
        create_model(model_name),
        deps_type=RootCauseMultiAgentDeps,
        output_type=wrap_output_type(SuddenDropAnalysisResult),
        system_prompt=build_system_prompt(settings.graphql_url),
        toolsets=[mcp_server],
        name="drop_detection_agent",
    )


def create_deps(settings: Settings | None = None) -> RootCauseMultiAgentDeps:
    if settings is None:
        settings = get_settings()
    return RootCauseMultiAgentDeps(graphql_url=settings.graphql_url)


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


async def run_root_cause_multi_agent_orchestration(
    save_filename: str,
    settings: Settings | None = None,
    model_name: str | None = None,
) -> MultiAgentAnalysisResult:
    if settings is None:
        settings = get_settings()

    actual_model = model_name or DEFAULT_MODEL

    # Create a fresh MCP server for each analysis run to avoid stale connection issues
    http_client = create_resilient_http_client(MCP_TIMEOUT_SECONDS)
    mcp_server = MCPServerStreamableHTTP(settings.sandbox_url, http_client=http_client)

    async with mcp_server:
        # Phase 1: Run drop detection agent
        deps = create_deps(settings)
        prompt = build_analysis_prompt(save_filename, deps.graphql_url)
        agent = create_drop_detection_agent(
            mcp_server,
            actual_model,
            settings,
        )

        drop_result = await agent.run(
            prompt,
            deps=deps,
        )

        drop_analysis = drop_result.output

        # Phase 2: Run root cause analysis for each drop
        drops_with_causes: list[SuddenDropWithRootCause] = []

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
