from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import logfire
from pydantic_evals import Dataset
from pydantic_evals.reporting import EvaluationReport

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
from agent.models import MultiAgentAnalysisResult
from agent.root_cause_multi_agent.orchestrator import (
    run_root_cause_multi_agent_orchestration,
)
from agent.settings import Settings, get_settings


@asynccontextmanager
async def eval_environment(
    fixture_path: str,
    settings: Settings | None = None,
) -> AsyncIterator[tuple[TestDatabaseContext, GraphQLServerProcess]]:
    if settings is None:
        settings = get_settings()

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


async def run_root_cause_multi_agent_eval(
    inputs: EvalInputs,
    model_name: str | None = None,
    settings: Settings | None = None,
) -> MultiAgentAnalysisResult:
    if settings is None:
        settings = get_settings()

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

            eval_settings = settings.model_copy(
                update={
                    "stellaris_stats_graphql_server_host": graphql_url.split("://")[
                        1
                    ].split(":")[0],
                    "stellaris_stats_graphql_server_port": int(
                        graphql_url.split(":")[-1],
                    ),
                },
            )

            return await run_root_cause_multi_agent_orchestration(
                save_filename=inputs["save_filename"],
                settings=eval_settings,
                model_name=model_name,
                parallel_root_cause=False,
            )
    except Exception as e:
        logfire.error(f"Root cause multi-agent eval failed: {e!r}")
        raise


def create_root_cause_multi_agent_eval_task(
    model_name: str | None = None,
    experiment_name: str | None = None,
    settings: Settings | None = None,
) -> EvalTask:
    async def eval_task(
        inputs: EvalInputs,
    ) -> MultiAgentAnalysisResult:
        return await run_root_cause_multi_agent_eval(
            inputs,
            model_name=model_name,
            settings=settings,
        )

    if experiment_name:
        eval_task.__name__ = experiment_name

    return eval_task


async def run_root_cause_multi_agent_evals(
    dataset: Dataset[EvalInputs, MultiAgentAnalysisResult, EvalMetadata],
    model_name: str | None = None,
    experiment_name: str | None = None,
    settings: Settings | None = None,
) -> EvaluationReport[EvalInputs, MultiAgentAnalysisResult, EvalMetadata]:
    logfire.configure(send_to_logfire="if-token-present")
    logfire.instrument_pydantic_ai()
    logfire.instrument_httpx()

    task = create_root_cause_multi_agent_eval_task(
        model_name,
        experiment_name,
        settings,
    )
    # Run sequentially to avoid MCP server cancel scope issues with concurrent tasks
    report = await dataset.evaluate(task, max_concurrency=1)

    report.print(
        include_input=True,
        include_output=True,
        include_durations=True,
    )

    averages = report.averages()
    if averages and averages.assertions is not None:
        print(f"\nOverall pass rate: {averages.assertions:.2%}")

    return report
