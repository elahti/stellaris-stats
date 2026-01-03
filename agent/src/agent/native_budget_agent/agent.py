from pydantic_ai import Agent, RunContext
from pydantic_ai.agent import AgentRunResult

from agent.constants import DEFAULT_MODEL, get_model, wrap_output_type
from agent.models import SuddenDropAnalysisResult
from agent.native_budget_agent.models import (
    BudgetSnapshot,
    BudgetTimeSeries,
    SaveInfo,
    SnapshotResourceTotals,
)
from agent.native_budget_agent.tools import (
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


def build_system_prompt() -> str:
    return f"""You are a Stellaris game statistics analyst specializing in detecting sudden resource drops.

Your task is to identify resources that have experienced a significant sudden drop between any two consecutive datapoints in the analysis window.

## Workflow
1. If no save is specified, use get_available_saves to list available saves
2. Use get_budget_time_series to fetch the latest {ANALYSIS_DATAPOINTS} budget snapshots with summed resource totals
3. Analyze the resource totals to identify sudden drops between consecutive snapshots

## Analysis Instructions
When you receive budget time series data with resource_totals:

1. The resource_totals contain each resource SUMMED ACROSS ALL budget categories for each snapshot
2. Compare CONSECUTIVE snapshots: D1->D2, D2->D3, D3->D4
3. For each resource, calculate the percentage drop between each consecutive pair
4. A "sudden drop" is when a resource drops by {DROP_THRESHOLD_PERCENT}% or more between any two consecutive snapshots
5. Only flag DROPS (negative changes), not increases

## Sudden Drop Detection Logic
- For each resource, compare values between consecutive snapshots (D1->D2, D2->D3, D3->D4)
- Calculate: drop_percent = ((earlier_value - later_value) / abs(earlier_value)) * 100
- A drop is ONLY when the later value is LESS than the earlier value (positive drop_absolute)
- If drop_percent >= {DROP_THRESHOLD_PERCENT} for ANY consecutive pair, it's a sudden drop
- Report the specific dates where the drop occurred (start_date and end_date of that pair)

## Edge Cases
- If earlier value is 0 or very close to 0, skip that resource
- If both values are 0, no drop
- Negative to more negative is NOT a drop (e.g., -100 to -130)

## Important Considerations
- Focus on NET balance changes (the totals are already net of income and expenses)
- A resource going from +100 to +70 is a 30% drop
- A resource going from -100 to -130 is NOT a drop (getting worse but in same direction)
- A resource going from +100 to -50 is a significant drop
- A drop that later recovers is STILL a sudden drop (report when it happened)

## Context
The game starts on January 1, 2200. You are analyzing the {ANALYSIS_DATAPOINTS} most recent budget snapshots to detect sudden resource problems."""


def create_native_budget_agent(
    model_name: str,
) -> Agent[AgentDeps, SuddenDropAnalysisResult]:
    agent: Agent[AgentDeps, SuddenDropAnalysisResult] = Agent(
        get_model(model_name),
        deps_type=AgentDeps,
        output_type=wrap_output_type(SuddenDropAnalysisResult),
        system_prompt=build_system_prompt(),
    )
    _register_tools(agent)
    return agent


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
        f"Compare consecutive datapoints (D1->D2, D2->D3, D3->D4) to identify any resources with sudden drops of {DROP_THRESHOLD_PERCENT}% or more. "
        f"Return the analysis result with a summary of sudden drops found."
    )


async def run_native_budget_analysis(
    save_filename: str,
    deps: AgentDeps | None = None,
    model_name: str | None = None,
) -> AgentRunResult[SuddenDropAnalysisResult]:
    if deps is None:
        deps = create_deps()
    prompt = build_analysis_prompt(save_filename)
    actual_model = model_name or DEFAULT_MODEL
    agent = create_native_budget_agent(actual_model)
    return await agent.run(prompt, deps=deps)
