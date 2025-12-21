from typing import Any, TypedDict

import logfire
from pydantic_evals import Dataset
from pydantic_evals.reporting import EvaluationReport

from agent.budget_agent.agent import build_analysis_prompt, get_budget_agent
from agent.budget_agent.models import SustainedDropAnalysisResult
from agent.budget_agent.tools import AgentDeps
from agent.evals.mock_client import create_mock_client, load_fixture


class EvalInputs(TypedDict):
    save_filename: str
    fixture_path: str


async def run_budget_eval(
    inputs: EvalInputs,
    model_name: str | None = None,
) -> SustainedDropAnalysisResult:
    fixture = load_fixture(inputs["fixture_path"])
    mock_client = create_mock_client(fixture)
    deps = AgentDeps(client=mock_client)

    prompt = build_analysis_prompt(inputs["save_filename"])
    agent = get_budget_agent()
    if model_name:
        with agent.override(model=model_name):
            result = await agent.run(prompt, deps=deps)
    else:
        result = await agent.run(prompt, deps=deps)

    return result.output


def create_eval_task(model_name: str | None = None):
    async def eval_task(
        inputs: EvalInputs,
    ) -> SustainedDropAnalysisResult:
        return await run_budget_eval(inputs, model_name=model_name)

    return eval_task


async def run_evals(
    dataset: Dataset[EvalInputs, SustainedDropAnalysisResult, dict[str, Any]],
    model_name: str | None = None,
) -> EvaluationReport[EvalInputs, SustainedDropAnalysisResult, dict[str, Any]]:
    logfire.configure(send_to_logfire="if-token-present")
    logfire.instrument_pydantic_ai()
    logfire.instrument_httpx()

    task = create_eval_task(model_name)
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
