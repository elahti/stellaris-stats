from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import logfire
from pydantic_evals import Dataset
from pydantic_evals.reporting import EvaluationReport

from agent.constants import DEFAULT_MODEL
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
from agent.native_budget.agent import (
    build_analysis_prompt,
    create_native_budget_agent,
)
from agent.native_budget.tools import create_deps
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


async def run_native_budget_eval(
    inputs: EvalInputs,
    model_name: str | None = None,
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

            # Create a custom GraphQL client pointing to the test server
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

            client = eval_settings.create_graphql_client()
            deps = create_deps(client=client, settings=eval_settings)

            prompt = build_analysis_prompt(inputs["save_filename"])
            actual_model = model_name or DEFAULT_MODEL
            agent = create_native_budget_agent(actual_model)

            result = await agent.run(
                prompt,
                deps=deps,
            )

            return result.output
    except Exception as e:
        logfire.error(f"Native budget eval failed: {e!r}")
        raise


def create_native_budget_eval_task(
    model_name: str | None = None,
    experiment_name: str | None = None,
    settings: Settings | None = None,
) -> LegacyEvalTask:
    async def eval_task(
        inputs: EvalInputs,
    ) -> SuddenDropAnalysisResult:
        return await run_native_budget_eval(
            inputs,
            model_name=model_name,
            settings=settings,
        )

    if experiment_name:
        eval_task.__name__ = experiment_name

    return eval_task


async def run_native_budget_evals(
    dataset: Dataset[EvalInputs, SuddenDropAnalysisResult, EvalMetadata],
    model_name: str | None = None,
    experiment_name: str | None = None,
    settings: Settings | None = None,
) -> EvaluationReport[EvalInputs, SuddenDropAnalysisResult, EvalMetadata]:
    logfire.configure(send_to_logfire="if-token-present")
    logfire.instrument_pydantic_ai()
    logfire.instrument_httpx()

    task = create_native_budget_eval_task(
        model_name,
        experiment_name,
        settings,
    )
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
