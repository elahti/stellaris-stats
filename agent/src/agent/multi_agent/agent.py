from __future__ import annotations

from pydantic_ai.settings import ModelSettings

from agent.models import MultiAgentAnalysisResult
from agent.multi_agent.orchestrator import (
    SandboxAgentDeps,
    create_deps,
    run_multi_agent_analysis,
)
from agent.settings import Settings

__all__ = [
    "SandboxAgentDeps",
    "create_deps",
    "run_sandbox_budget_analysis",
]


async def run_sandbox_budget_analysis(
    save_filename: str,
    model_name: str | None = None,
    model_settings: ModelSettings | None = None,
    settings: Settings | None = None,
    parallel_root_cause: bool = False,
) -> MultiAgentAnalysisResult:
    if settings is None:
        settings = Settings()
    return await run_multi_agent_analysis(
        save_filename=save_filename,
        settings=settings,
        model_name=model_name,
        model_settings=model_settings,
        parallel_root_cause=parallel_root_cause,
    )
