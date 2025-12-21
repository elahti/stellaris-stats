from pydantic_ai import Agent, NativeOutput, RunContext
from pydantic_ai.agent import AgentRunResult

from agent.models import (
    BudgetSnapshot,
    BudgetTimeSeries,
    SaveInfo,
    SustainedDropAnalysisResult,
)
from agent.tools import (
    AgentDeps,
    create_deps,
    fetch_budget_data,
    get_available_dates,
    get_gamestates_for_dates,
    list_saves,
    select_latest_dates,
)

CONSECUTIVE_PERIODS_THRESHOLD = 4
ANALYSIS_DATAPOINTS = CONSECUTIVE_PERIODS_THRESHOLD + 2


def build_system_prompt() -> str:
    return f"""You are a Stellaris game statistics analyst specializing in detecting sustained resource drops.

Your task is to identify resources that have been consistently low or dropping over multiple consecutive time periods.

## Workflow
1. If no save is specified, use get_available_saves to list available saves
2. Use get_budget_time_series to fetch the latest {ANALYSIS_DATAPOINTS} budget snapshots
3. Analyze the time series data to identify sustained drops

## Analysis Instructions
When you receive budget time series data:

1. For each resource in the balance categories, examine the {ANALYSIS_DATAPOINTS} values over time
2. Identify "sustained drops" where:
   - The resource balance has been NEGATIVE (< 0) for {CONSECUTIVE_PERIODS_THRESHOLD} or more consecutive RECENT periods
   - Only look at the most recent periods (if last {CONSECUTIVE_PERIODS_THRESHOLD}+ values are negative, it's a sustained drop)
3. Focus only on DROPS (negative balances), not spikes (positive changes)
4. Ignore resources that:
   - Have been at 0 throughout the series
   - Are occasionally negative but recover
   - Have only recently started dropping (< {CONSECUTIVE_PERIODS_THRESHOLD} consecutive periods)

## Sustained Drop Detection Logic
- Compare each resource's values across the {ANALYSIS_DATAPOINTS} datapoints (ordered oldest to newest)
- A sustained drop is when the last {CONSECUTIVE_PERIODS_THRESHOLD}, {CONSECUTIVE_PERIODS_THRESHOLD + 1}, or all {ANALYSIS_DATAPOINTS} values are negative
- The severity is determined by how many consecutive periods and how negative

## Context
The game starts on January 1, 2200. You are analyzing the {ANALYSIS_DATAPOINTS} most recent budget snapshots to detect ongoing resource problems."""


budget_agent = Agent(
    "openai:gpt-5.2-2025-12-11",
    deps_type=AgentDeps,
    output_type=NativeOutput(SustainedDropAnalysisResult),
    system_prompt=build_system_prompt(),
)


@budget_agent.tool
async def get_available_saves(ctx: RunContext[AgentDeps]) -> list[SaveInfo]:
    """Get a list of all available save files that can be analyzed."""
    saves = await list_saves(ctx.deps.client)
    return [SaveInfo(filename=s.filename, name=s.name) for s in saves]


@budget_agent.tool
async def get_budget_time_series(
    ctx: RunContext[AgentDeps],
    save_filename: str,
) -> BudgetTimeSeries | str:
    """Fetch budget time series data for the latest datapoints.

    Returns budget balance data for the most recent dates to analyze trends.
    You must analyze this data to identify sustained resource drops.

    Args:
        ctx: The run context containing dependencies.
        save_filename: The filename of the save to analyze (without .sav extension).
    """
    client = ctx.deps.client

    dates = await get_available_dates(client, save_filename)
    if not dates:
        return f"No gamestates found for save '{save_filename}'. Please check the filename."

    if len(dates) < ANALYSIS_DATAPOINTS:
        return f"Not enough data points in save '{save_filename}' (need {ANALYSIS_DATAPOINTS}, found {len(dates)})."

    selected_dates = select_latest_dates(dates, count=ANALYSIS_DATAPOINTS)

    budget_data = await fetch_budget_data(client, save_filename)
    gamestates = get_gamestates_for_dates(budget_data, selected_dates)

    if gamestates is None:
        return f"Error fetching budget data for save '{save_filename}'."

    snapshots = [
        BudgetSnapshot(
            date=str(gs.date),
            budget=gs.budget.balance.model_dump(by_alias=True),
        )
        for gs in gamestates
    ]

    return BudgetTimeSeries(
        save_filename=save_filename,
        dates=selected_dates,
        snapshots=snapshots,
    )


def build_analysis_prompt(save_filename: str) -> str:
    return (
        f"Fetch and analyze the budget for save '{save_filename}'. "
        f"Use get_budget_time_series to get the latest {ANALYSIS_DATAPOINTS} budget snapshots, then analyze them. "
        f"Identify any resources with sustained negative balances ({CONSECUTIVE_PERIODS_THRESHOLD}+ consecutive periods). "
        f"Return the analysis result with a summary of sustained drops."
    )


async def run_budget_analysis(
    save_filename: str,
    deps: AgentDeps | None = None,
    model_name: str | None = None,
) -> AgentRunResult[SustainedDropAnalysisResult]:
    """Run budget analysis for a specific save file.

    Args:
        save_filename: The filename of the save to analyze (without .sav extension).
        deps: Optional dependencies to use. If not provided, creates default deps.
        model_name: Optional model to use. If not provided, uses the default agent model.

    Returns:
        The complete agent run result.
    """
    if deps is None:
        deps = create_deps()
    prompt = build_analysis_prompt(save_filename)
    if model_name:
        with budget_agent.override(model=model_name):
            return await budget_agent.run(prompt, deps=deps)
    return await budget_agent.run(prompt, deps=deps)
