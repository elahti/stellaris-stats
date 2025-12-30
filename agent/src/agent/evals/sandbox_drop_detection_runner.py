from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import logfire
from pydantic_ai.settings import ModelSettings
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
from agent.evals.types import EvalInputs, EvalMetadata, LegacyEvalTask
from agent.models import SuddenDropAnalysisResult
from agent.sandbox_drop_detection.agent import run_sandbox_drop_detection_analysis
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


async def run_sandbox_drop_detection_eval(
    inputs: EvalInputs,
    model_name: str | None = None,
    model_settings: ModelSettings | None = None,
    settings: Settings | None = None,
) -> SuddenDropAnalysisResult:
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

            result = await run_sandbox_drop_detection_analysis(
                save_filename=inputs["save_filename"],
                model_name=model_name,
                model_settings=model_settings,
                settings=eval_settings,
            )
            return result.output
    except Exception as e:
        logfire.error(f"Sandbox drop detection eval failed: {e!r}")
        raise


def create_sandbox_drop_detection_eval_task(
    model_name: str | None = None,
    model_settings: ModelSettings | None = None,
    experiment_name: str | None = None,
    settings: Settings | None = None,
) -> LegacyEvalTask:
    async def eval_task(
        inputs: EvalInputs,
    ) -> SuddenDropAnalysisResult:
        return await run_sandbox_drop_detection_eval(
            inputs,
            model_name=model_name,
            model_settings=model_settings,
            settings=settings,
        )

    if experiment_name:
        eval_task.__name__ = experiment_name

    return eval_task


async def run_sandbox_drop_detection_evals(
    dataset: Dataset[EvalInputs, SuddenDropAnalysisResult, EvalMetadata],
    model_name: str | None = None,
    experiment_name: str | None = None,
    settings: Settings | None = None,
    model_settings: ModelSettings | None = None,
) -> EvaluationReport[EvalInputs, SuddenDropAnalysisResult, EvalMetadata]:
    logfire.configure(send_to_logfire="if-token-present")
    logfire.instrument_pydantic_ai()
    logfire.instrument_httpx()

    task = create_sandbox_drop_detection_eval_task(
        model_name,
        model_settings,
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
