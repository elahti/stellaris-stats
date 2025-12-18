import json

import httpx
from pydantic_ai import Agent, RunContext

from agent.models import BudgetAnalysisResult
from agent.tools import (
    AgentDeps,
    fetch_budget_comparison,
    find_comparison_dates,
    get_available_dates,
    list_saves,
)

DEFAULT_THRESHOLD_PERCENT = 15.0

SYSTEM_PROMPT = """You are a Stellaris game statistics analyst specializing in empire budget analysis.

Your task is to identify sudden changes in an empire's resource production by analyzing budget balance data.

## Workflow
1. If no save is specified, use get_available_saves to list available saves
2. Use get_budget_comparison to fetch raw budget data for the specified save
3. Analyze the data yourself to identify significant changes

## Analysis Instructions
When you receive budget data from get_budget_comparison, you must:

1. Compare each resource in each category between previous_budget and current_budget
2. Calculate percentage change: ((current - previous) / |previous|) * 100
   - Skip if previous value is 0 (cannot calculate percentage)
   - Skip if absolute change is negligible (< 0.1)
3. Identify changes that exceed the threshold_percent (default 15%)
4. Focus on the most significant changes that would impact gameplay

## Output Requirements
Populate the BudgetAnalysisResult with:
- save_filename: The save file analyzed
- previous_date: The earlier date from the comparison
- current_date: The later date from the comparison
- threshold_percent: The threshold used (from the data)
- sudden_changes: List of BudgetChange objects for categories with significant changes
  - Each BudgetChange has category_type ("balance"), category_name, and list of ResourceChange
  - Each ResourceChange has resource name, previous_value, current_value, change_absolute, change_percent
- summary: A brief summary of the most impactful changes and their potential game implications

## Context
The game starts on January 1, 2200. The comparison is between the latest available date and approximately one year prior."""


budget_agent = Agent(
    "anthropic:claude-sonnet-4-5-20250929",
    deps_type=AgentDeps,
    output_type=BudgetAnalysisResult,
    system_prompt=SYSTEM_PROMPT,
)


@budget_agent.tool
async def get_available_saves(ctx: RunContext[AgentDeps]) -> str:
    """Get a list of all available save files that can be analyzed."""
    saves = await list_saves(ctx.deps.http_client)
    if not saves:
        return "No save files available."
    result = "Available saves:\n"
    for save in saves:
        result += f"- {save['filename']} ({save['name']})\n"
    return result


@budget_agent.tool
async def get_budget_comparison(ctx: RunContext[AgentDeps], save_filename: str) -> str:
    """Fetch raw budget data for comparison between two dates.

    Returns the budget data for the latest date and approximately one year prior.
    You must analyze this data yourself to identify significant changes.

    Args:
        ctx: The run context containing dependencies.
        save_filename: The filename of the save to analyze (without .sav extension).
    """
    client = ctx.deps.http_client
    threshold = ctx.deps.threshold_percent

    dates = await get_available_dates(client, save_filename)
    if not dates:
        return f"No gamestates found for save '{save_filename}'. Please check the filename."

    comparison = find_comparison_dates(dates)
    if comparison is None:
        return f"Not enough data points in save '{save_filename}' for comparison (need at least 2 dates)."

    previous_date, current_date = comparison

    comparison_data = await fetch_budget_comparison(
        client,
        save_filename,
        previous_date,
        current_date,
    )

    if "error" in comparison_data:
        return f"Error fetching budget data: {comparison_data['error']}"

    comparison_data["save_filename"] = save_filename
    comparison_data["threshold_percent"] = threshold

    return json.dumps(comparison_data, indent=2)


def _build_analysis_prompt(save_filename: str, threshold: float) -> str:
    return (
        f"Fetch and analyze the budget for save '{save_filename}'. "
        f"Use get_budget_comparison to get the raw budget data, then analyze it yourself. "
        f"Identify any sudden changes in resource production that exceed {threshold}%. "
        f"Return the analysis result with a summary of the most significant changes."
    )


async def run_budget_analysis(save_filename: str) -> BudgetAnalysisResult:
    """Run budget analysis for a specific save file.

    Args:
        save_filename: The filename of the save to analyze (without .sav extension).

    Returns:
        The budget analysis result.
    """
    threshold = DEFAULT_THRESHOLD_PERCENT
    async with httpx.AsyncClient(timeout=60.0) as client:
        deps = AgentDeps(http_client=client, threshold_percent=threshold)
        prompt = _build_analysis_prompt(save_filename, threshold)
        result = await budget_agent.run(prompt, deps=deps)
        return result.output
