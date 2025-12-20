from typing import Any, TypedDict

import logfire
from pydantic_evals import Dataset
from pydantic_evals.reporting import EvaluationReport

from agent.budget_agent import budget_agent, build_analysis_prompt
from agent.evals.mock_client import create_mock_client, load_fixture
from agent.models import SustainedDropAnalysisResult
from agent.tools import AgentDeps


class EvalInputs(TypedDict):
    save_filename: str
    fixture_path: str


async def run_budget_eval(
    inputs: EvalInputs,
) -> SustainedDropAnalysisResult:
    fixture = load_fixture(inputs["fixture_path"])
    mock_client = create_mock_client(fixture)
    deps = AgentDeps(client=mock_client)

    prompt = build_analysis_prompt(inputs["save_filename"])
    result = await budget_agent.run(prompt, deps=deps)

    return result.output


def create_eval_task(model_name: str | None = None):
    async def eval_task(
        inputs: EvalInputs,
    ) -> SustainedDropAnalysisResult:
        if model_name:
            with budget_agent.override(model=model_name):
                return await run_budget_eval(inputs)
        return await run_budget_eval(inputs)

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
