from pydantic_ai import Agent, RunContext

from agent.models import BudgetAnalysisResult
from agent.tools import (
    AgentDeps,
    analyze_budget_changes,
    fetch_budget_comparison,
    find_comparison_dates,
    get_available_dates,
    list_saves,
)

SYSTEM_PROMPT = """You are a Stellaris game statistics analyst specializing in empire budget analysis.

Your task is to identify sudden changes in an empire's resource production by analyzing the budget balance data.

When analyzing budget changes:
1. First, use the get_available_saves tool to list saves if the user hasn't specified one
2. Use the analyze_budget tool to fetch and analyze budget data for a specific save
3. Present your findings clearly, highlighting the most significant changes

Focus on changes that exceed the configured threshold (default 15%).
Explain what categories and resources changed significantly and potential game implications.

The game starts on January 1, 2200. When comparing dates, the analysis compares the latest available date to approximately one year prior."""


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
async def analyze_budget(ctx: RunContext[AgentDeps], save_filename: str) -> str:
    """Analyze budget changes for a specific save file.

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
        client, save_filename, previous_date, current_date,
    )

    result = analyze_budget_changes(save_filename, comparison_data, threshold)

    output_lines = [
        f"Budget Analysis for: {result.save_filename}",
        f"Period: {result.previous_date} to {result.current_date}",
        f"Threshold: {result.threshold_percent}%",
        "",
        result.summary,
        "",
    ]

    if result.sudden_changes:
        output_lines.append("Detailed Changes:")
        for change in result.sudden_changes:
            output_lines.append(f"\n  Category: {change.category_name}")
            for rc in change.changes:
                direction = "increased" if rc.change_percent > 0 else "decreased"
                output_lines.append(
                    f"    - {rc.resource}: {rc.previous_value:.2f} → {rc.current_value:.2f} ({direction} {abs(rc.change_percent):.1f}%)",
                )

    return "\n".join(output_lines)
