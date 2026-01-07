from __future__ import annotations

from typing import TYPE_CHECKING

from agent.analysis_config import BUDGET_CATEGORIES, RESOURCE_FIELDS

if TYPE_CHECKING:
    from agent.models import SuddenDrop


def _build_budget_entry_fields() -> str:
    return " ".join(RESOURCE_FIELDS)


def _build_budget_category_fields() -> str:
    entry_fields = _build_budget_entry_fields()
    return "\n".join(f"      {cat} {{ {entry_fields} }}" for cat in BUDGET_CATEGORIES)


def build_root_cause_system_prompt(graphql_url: str) -> str:
    budget_category_fields = _build_budget_category_fields()
    category_list = (
        ", ".join(BUDGET_CATEGORIES[:10]) + f", ... ({len(BUDGET_CATEGORIES)} total)"
    )

    return f"""You are a Stellaris budget analyst specializing in root cause analysis.

## Your Task

Given a detected sudden drop in a resource, identify the TOP 3 budget categories that contributed most to this drop.

## Your Workflow

1. Call the `run_python_code` tool with a single argument named `python_code` containing your Python code
2. The code must fetch income and expenses data from the GraphQL API
3. Analyze which categories caused the drop
4. Return ONLY the final JSON result (never print raw API data)

IMPORTANT: When calling the tool, you MUST provide the `python_code` argument.

## GraphQL API

URL: {graphql_url}

### Query to fetch income and expenses:
```graphql
query GetIncomeExpenses($filename: String!) {{
  save(filename: $filename) {{
    gamestates {{
      date
      budget {{
        income {{
{budget_category_fields}
        }}
        expenses {{
{budget_category_fields}
        }}
      }}
    }}
  }}
}}
```

## Budget Categories
{category_list}

## Analysis Algorithm

For a given resource drop from start_date to end_date:

1. Fetch income and expenses for both dates
2. For each budget category, calculate the change in the dropped resource:
   - income_change = income[end_date][category][resource] - income[start_date][category][resource]
   - expenses_change = expenses[end_date][category][resource] - expenses[start_date][category][resource]

3. Identify contributors:
   - If income_change < 0: This is "income_decreased" with impact = abs(income_change)
   - If expenses_change > 0: This is "expenses_increased" with impact = abs(expenses_change)

4. Rank all contributors by impact (absolute value)

5. Return only the TOP 3 contributors

## Important Notes

- Focus ONLY on the specific resource that dropped
- Consider BOTH income decreases AND expense increases
- The sum of contributors may not equal the total drop (other factors exist)
- Handle null/missing values as 0
- Filter dates to only include the start_date and end_date (not all gamestates)

## CRITICAL RULES

1. Print ONLY the final JSON result - never print intermediate data or debug info
2. The GraphQL response is very large - process it in memory, do not print it
3. Use httpx for HTTP requests (available in sandbox)
4. Handle errors gracefully and return valid JSON even on failure

## Required Output Format

Your code MUST print exactly ONE JSON object:
```json
{{
  "resource": "energy",
  "start_date": "2307-01-01 00:00:00+00:00",
  "end_date": "2307-04-01 00:00:00+00:00",
  "drop_percent": 40.0,
  "top_contributors": [
    {{
      "category": "ships",
      "resource": "energy",
      "contributor_type": "expenses_increased",
      "before_value": 50.0,
      "after_value": 80.0,
      "change_absolute": 30.0,
      "change_percent": 60.0,
      "rank": 1
    }},
    {{
      "category": "planetBuildings",
      "resource": "energy",
      "contributor_type": "income_decreased",
      "before_value": 100.0,
      "after_value": 70.0,
      "change_absolute": 30.0,
      "change_percent": -30.0,
      "rank": 2
    }},
    {{
      "category": "starbases",
      "resource": "energy",
      "contributor_type": "expenses_increased",
      "before_value": 20.0,
      "after_value": 35.0,
      "change_absolute": 15.0,
      "change_percent": 75.0,
      "rank": 3
    }}
  ],
  "explanation": "The energy balance drop was primarily caused by..."
}}
```
"""


def build_root_cause_analysis_prompt(
    drop: SuddenDrop,
    save_filename: str,
    graphql_url: str,
) -> str:
    return f"""Analyze the root cause of this sudden drop:

Resource: {drop.resource}
Save file: {save_filename}
Start date: {drop.start_date}
End date: {drop.end_date}
Drop: {drop.drop_percent:.1f}% (from {drop.start_value:.2f} to {drop.end_value:.2f})

GraphQL URL: {graphql_url}

Instructions:
1. Fetch income and expenses for ONLY the start_date and end_date using the GraphQL API
2. For the '{drop.resource}' resource, compare each budget category between the two dates
3. Find categories where income decreased OR expenses increased
4. Rank by absolute impact and return the TOP 3 contributors
5. Label each as "income_decreased" or "expenses_increased"

IMPORTANT: Print ONLY the final JSON result. Never print raw API data or intermediate results."""
