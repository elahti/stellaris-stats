from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any, TypedDict

import logfire
from pydantic_evals import Dataset
from pydantic_evals.reporting import EvaluationReport

from agent.budget_agent.models import SuddenDropAnalysisResult
from agent.evals.fixture_loader import load_fixture
from agent.evals.server_manager import (
    GraphQLServerProcess,
    start_graphql_server,
    stop_graphql_server,
)
from agent.evals.test_database import (
    TestDatabaseContext,
    create_test_database,
    destroy_test_database,
)
from agent.sandbox_budget_agent.agent import (
    SandboxAgentDeps,
    get_mcp_server,
    get_sandbox_budget_agent,
)
from agent.sandbox_budget_agent.prompts import build_analysis_prompt
from agent.settings import Settings


class SandboxEvalInputs(TypedDict):
    save_filename: str
    fixture_path: str


@asynccontextmanager
async def eval_environment(
    fixture_path: str,
    settings: Settings | None = None,
) -> AsyncIterator[tuple[TestDatabaseContext, GraphQLServerProcess]]:
    if settings is None:
        settings = Settings()

    db_ctx = await create_test_database(settings)
    try:
        await load_fixture(db_ctx.pool, fixture_path)
        server = await start_graphql_server(db_ctx)
        try:
            yield db_ctx, server
        finally:
            await stop_graphql_server(server)
    finally:
        await destroy_test_database(db_ctx, settings)


async def run_sandbox_budget_eval(
    inputs: SandboxEvalInputs,
    model_name: str | None = None,
    settings: Settings | None = None,
) -> SuddenDropAnalysisResult:
    if settings is None:
        settings = Settings()

    try:
        async with eval_environment(
            inputs["fixture_path"],
            settings,
        ) as (_db_ctx, server):
            if settings.stellaris_stats_eval_graphql_server_host:
                graphql_url = (
                    f"http://{settings.stellaris_stats_eval_graphql_server_host}"
                    f":{server.port}"
                )
            else:
                graphql_url = server.url

            deps = SandboxAgentDeps(graphql_url=graphql_url)
            prompt = build_analysis_prompt(inputs["save_filename"], graphql_url)

            agent = get_sandbox_budget_agent(settings)
            mcp_server = get_mcp_server(settings)

            async with mcp_server:
                if model_name:
                    with agent.override(model=model_name):
                        result = await agent.run(prompt, deps=deps)
                else:
                    result = await agent.run(prompt, deps=deps)

            return result.output
    except Exception as e:
        logfire.error(f"Sandbox eval failed: {e!r}")
        raise


def create_sandbox_eval_task(
    model_name: str | None = None,
    experiment_name: str | None = None,
    settings: Settings | None = None,
):
    async def eval_task(
        inputs: SandboxEvalInputs,
    ) -> SuddenDropAnalysisResult:
        return await run_sandbox_budget_eval(
            inputs,
            model_name=model_name,
            settings=settings,
        )

    if experiment_name:
        eval_task.__name__ = experiment_name

    return eval_task


async def run_sandbox_evals(
    dataset: Dataset[SandboxEvalInputs, SuddenDropAnalysisResult, dict[str, Any]],
    model_name: str | None = None,
    experiment_name: str | None = None,
    settings: Settings | None = None,
) -> EvaluationReport[SandboxEvalInputs, SuddenDropAnalysisResult, dict[str, Any]]:
    logfire.configure(send_to_logfire="if-token-present")
    logfire.instrument_pydantic_ai()
    logfire.instrument_httpx()

    task = create_sandbox_eval_task(model_name, experiment_name, settings)
    report = await dataset.evaluate(task)

    report.print(
        include_input=True,
        include_output=True,
        include_durations=True,
    )

    averages = report.averages()
    if averages and averages.assertions is not None:
        print(f"\nOverall pass rate: {averages.assertions:.2%}")

    return report
