from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import logfire
from pydantic_ai import Agent, NativeOutput
from pydantic_ai.mcp import MCPServerStreamableHTTP
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
from agent.evals.types import EvalInputs, EvalMetadata, EvalTask
from agent.sandbox_budget_agent.agent import SandboxAgentDeps
from agent.sandbox_budget_agent.prompts import (
    build_analysis_prompt,
    build_system_prompt,
)
from agent.settings import Settings


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


def _create_eval_agent(
    mcp_server: MCPServerStreamableHTTP,
    graphql_url: str,
) -> Agent[SandboxAgentDeps, SuddenDropAnalysisResult]:
    return Agent(
        "openai:gpt-5.2-2025-12-11",
        deps_type=SandboxAgentDeps,
        output_type=NativeOutput(SuddenDropAnalysisResult),
        system_prompt=build_system_prompt(graphql_url),
        toolsets=[mcp_server],
    )


async def run_sandbox_budget_eval(
    inputs: EvalInputs,
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

            mcp_server = MCPServerStreamableHTTP(settings.sandbox_url)
            agent = _create_eval_agent(mcp_server, graphql_url)

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
) -> EvalTask:
    """Create a sandbox evaluation task function with the specified configuration."""

    async def eval_task(
        inputs: EvalInputs,
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
    dataset: Dataset[EvalInputs, SuddenDropAnalysisResult, EvalMetadata],
    model_name: str | None = None,
    experiment_name: str | None = None,
    settings: Settings | None = None,
) -> EvaluationReport[EvalInputs, SuddenDropAnalysisResult, EvalMetadata]:
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
