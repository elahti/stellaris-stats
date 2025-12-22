from pydantic_ai import Agent, NativeOutput, RunContext
from pydantic_ai.agent import AgentRunResult

from agent.budget_agent.models import (
    BudgetSnapshot,
    BudgetTimeSeries,
    SaveInfo,
    SnapshotResourceTotals,
    SuddenDropAnalysisResult,
)
from agent.budget_agent.tools import (
    AgentDeps,
    create_deps,
    fetch_budget_data,
    get_available_dates,
    get_gamestates_for_dates,
    list_saves,
    select_latest_dates,
)

DROP_THRESHOLD_PERCENT = 30.0
ANALYSIS_DATAPOINTS = 4

RESOURCE_FIELDS = [
    "energy",
    "minerals",
    "alloys",
    "food",
    "consumerGoods",
    "influence",
    "unity",
    "trade",
    "physicsResearch",
    "societyResearch",
    "engineeringResearch",
    "exoticGases",
    "rareCrystals",
    "volatileMotes",
    "srDarkMatter",
    "srLivingMetal",
    "srZro",
    "nanites",
    "minorArtifacts",
    "astralThreads",
]


def sum_resources_for_snapshot(snapshot: BudgetSnapshot) -> dict[str, float]:
    """Sum each resource across all budget categories for a single snapshot."""
    totals: dict[str, float] = dict.fromkeys(RESOURCE_FIELDS, 0.0)

    for category_data in snapshot.budget.values():
        if category_data is None:
            continue
        for resource in RESOURCE_FIELDS:
            value = category_data.get(resource)
            if value is not None:
                totals[resource] += value

    return totals


_budget_agent: Agent[AgentDeps, SuddenDropAnalysisResult] | None = None


def build_system_prompt() -> str:
    return f"""You are a Stellaris game statistics analyst specializing in detecting sudden resource drops.

Your task is to identify resources that have experienced a significant sudden drop between the first and last datapoints in the analysis window.

## Workflow
1. If no save is specified, use get_available_saves to list available saves
2. Use get_budget_time_series to fetch the latest {ANALYSIS_DATAPOINTS} budget snapshots with summed resource totals
3. Analyze the resource totals to identify sudden drops

## Analysis Instructions
When you receive budget time series data with resource_totals:

1. The resource_totals contain each resource SUMMED ACROSS ALL budget categories for each snapshot
2. Compare the FIRST snapshot (oldest, D1) directly to the LAST snapshot (newest, D4)
3. For each resource, calculate the percentage drop from D1 to D4
4. A "sudden drop" is when a resource drops by {DROP_THRESHOLD_PERCENT}% or more from D1 to D4
5. Only flag DROPS (negative changes), not increases

## Sudden Drop Detection Logic
- For each resource, compare value at D1 (first/oldest) with value at D4 (last/newest)
- Calculate: drop_percent = ((D1_value - D4_value) / abs(D1_value)) * 100
- If drop_percent >= {DROP_THRESHOLD_PERCENT}, it's a sudden drop
- Handle edge cases:
  - If D1 value is 0 or very close to 0, skip percentage calculation
  - If both values are 0, no drop
  - Negative to more negative is NOT a drop (getting worse but in same direction)

## Important Considerations
- Focus on NET balance changes (the totals are already net of income and expenses)
- A resource going from +100 to +70 is a 30% drop
- A resource going from -100 to -130 is NOT a drop (getting worse but in same direction)
- A resource going from +100 to -50 is a significant drop

## Context
The game starts on January 1, 2200. You are analyzing the {ANALYSIS_DATAPOINTS} most recent budget snapshots to detect sudden resource problems."""


def get_budget_agent() -> Agent[AgentDeps, SuddenDropAnalysisResult]:
    global _budget_agent
    if _budget_agent is None:
        _budget_agent = Agent(
            "openai:gpt-5.2-2025-12-11",
            deps_type=AgentDeps,
            output_type=NativeOutput(SuddenDropAnalysisResult),
            system_prompt=build_system_prompt(),
        )
        _register_tools(_budget_agent)
    return _budget_agent


async def _get_available_saves(ctx: RunContext[AgentDeps]) -> list[SaveInfo]:
    """Get a list of all available save files that can be analyzed."""
    saves = await list_saves(ctx.deps.client)
    return [SaveInfo(filename=s.filename, name=s.name) for s in saves]


async def _get_budget_time_series(
    ctx: RunContext[AgentDeps],
    save_filename: str,
) -> BudgetTimeSeries | str:
    """Fetch budget time series data with summed resource totals for the latest datapoints.

    Returns budget balance data with resource totals summed across all categories.
    Use the resource_totals to identify sudden drops by comparing D1 (first) to D4 (last).

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

    resource_totals = [
        SnapshotResourceTotals(
            date=snapshot.date,
            totals=sum_resources_for_snapshot(snapshot),
        )
        for snapshot in snapshots
    ]

    return BudgetTimeSeries(
        save_filename=save_filename,
        dates=selected_dates,
        snapshots=snapshots,
        resource_totals=resource_totals,
    )


def _register_tools(agent: Agent[AgentDeps, SuddenDropAnalysisResult]) -> None:
    agent.tool(_get_available_saves)
    agent.tool(_get_budget_time_series)


def build_analysis_prompt(save_filename: str) -> str:
    return (
        f"Fetch and analyze the budget for save '{save_filename}'. "
        f"Use get_budget_time_series to get the latest {ANALYSIS_DATAPOINTS} budget snapshots with summed resource totals. "
        f"Compare the first (D1) and last (D4) datapoints to identify any resources with sudden drops of {DROP_THRESHOLD_PERCENT}% or more. "
        f"Return the analysis result with a summary of sudden drops found."
    )


async def run_budget_analysis(
    save_filename: str,
    deps: AgentDeps | None = None,
    model_name: str | None = None,
) -> AgentRunResult[SuddenDropAnalysisResult]:
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
    agent = get_budget_agent()
    if model_name:
        with agent.override(model=model_name):
            return await agent.run(prompt, deps=deps)
    return await agent.run(prompt, deps=deps)
