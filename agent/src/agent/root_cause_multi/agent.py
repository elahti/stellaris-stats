from __future__ import annotations

from agent.models import MultiAgentAnalysisResult
from agent.root_cause_multi.orchestrator import (
    RootCauseMultiAgentDeps,
    create_deps,
    run_root_cause_multi_agent_orchestration,
)
from agent.settings import Settings, get_settings

__all__ = [
    "RootCauseMultiAgentDeps",
    "create_deps",
    "run_root_cause_multi_agent_analysis",
]


async def run_root_cause_multi_agent_analysis(
    save_filename: str,
    model_name: str | None = None,
    settings: Settings | None = None,
) -> MultiAgentAnalysisResult:
    if settings is None:
        settings = get_settings()
    return await run_root_cause_multi_agent_orchestration(
        save_filename=save_filename,
        settings=settings,
        model_name=model_name,
    )
