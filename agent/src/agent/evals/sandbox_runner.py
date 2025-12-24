from typing import Any, TypedDict

import logfire
from pydantic_evals import Dataset
from pydantic_evals.reporting import EvaluationReport

from agent.budget_agent.models import SuddenDropAnalysisResult
from agent.evals.mock_client import load_fixture
from agent.evals.mock_graphql_server import start_mock_graphql_server
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


async def run_sandbox_budget_eval(
    inputs: SandboxEvalInputs,
    model_name: str | None = None,
    settings: Settings | None = None,
) -> SuddenDropAnalysisResult:
    if settings is None:
        settings = Settings()

    fixture = load_fixture(inputs["fixture_path"])

    async with start_mock_graphql_server(
        fixture,
        host="0.0.0.0",
    ) as mock_server:
        mock_graphql_url = (
            f"http://{settings.eval_mock_graphql_host}:{mock_server.port}"
        )

        deps = SandboxAgentDeps(graphql_url=mock_graphql_url)
        prompt = build_analysis_prompt(inputs["save_filename"], mock_graphql_url)

        agent = get_sandbox_budget_agent(settings)
        mcp_server = get_mcp_server(settings)

        async with mcp_server:
            if model_name:
                with agent.override(model=model_name):
                    result = await agent.run(prompt, deps=deps)
            else:
                result = await agent.run(prompt, deps=deps)

        return result.output


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
