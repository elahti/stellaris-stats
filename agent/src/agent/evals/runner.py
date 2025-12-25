from typing import Any, TypedDict

import logfire
from pydantic_evals import Dataset
from pydantic_evals.reporting import EvaluationReport

from agent.budget_agent.agent import build_analysis_prompt, get_budget_agent
from agent.budget_agent.models import SuddenDropAnalysisResult
from agent.budget_agent.tools import AgentDeps
from agent.evals.fixture_loader import load_fixture
from agent.evals.server_manager import start_graphql_server, stop_graphql_server
from agent.evals.test_database import create_test_database, destroy_test_database
from agent.settings import Settings


class EvalInputs(TypedDict):
    save_filename: str
    fixture_path: str


async def run_budget_eval(
    inputs: EvalInputs,
    model_name: str | None = None,
    settings: Settings | None = None,
) -> SuddenDropAnalysisResult:
    if settings is None:
        settings = Settings()

    db_ctx = await create_test_database(settings)
    try:
        await load_fixture(db_ctx.pool, inputs["fixture_path"])
        server = await start_graphql_server(db_ctx)
        try:
            client = settings.create_graphql_client()
            client.url = server.url
            deps = AgentDeps(client=client)

            prompt = build_analysis_prompt(inputs["save_filename"])
            agent = get_budget_agent()
            if model_name:
                with agent.override(model=model_name):
                    result = await agent.run(prompt, deps=deps)
            else:
                result = await agent.run(prompt, deps=deps)

            return result.output
        finally:
            await stop_graphql_server(server)
    finally:
        await destroy_test_database(db_ctx, settings)


def create_eval_task(
    model_name: str | None = None,
    experiment_name: str | None = None,
    settings: Settings | None = None,
):
    async def eval_task(
        inputs: EvalInputs,
    ) -> SuddenDropAnalysisResult:
        return await run_budget_eval(inputs, model_name=model_name, settings=settings)

    if experiment_name:
        eval_task.__name__ = experiment_name

    return eval_task


async def run_evals(
    dataset: Dataset[EvalInputs, SuddenDropAnalysisResult, dict[str, Any]],
    model_name: str | None = None,
    experiment_name: str | None = None,
    settings: Settings | None = None,
) -> EvaluationReport[EvalInputs, SuddenDropAnalysisResult, dict[str, Any]]:
    logfire.configure(send_to_logfire="if-token-present")
    logfire.instrument_pydantic_ai()
    logfire.instrument_httpx()

    task = create_eval_task(model_name, experiment_name, settings)
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
