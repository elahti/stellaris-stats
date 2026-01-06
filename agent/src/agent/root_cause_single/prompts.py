from agent.root_cause_multi.prompts import (
    ANALYSIS_DATAPOINTS,
    BUDGET_CATEGORIES,
    DROP_THRESHOLD_PERCENT,
    RESOURCE_FIELDS,
)


def _build_budget_entry_fields() -> str:
    return " ".join(RESOURCE_FIELDS)


def _build_budget_category_fields() -> str:
    entry_fields = _build_budget_entry_fields()
    return "\n".join(f"        {cat} {{ {entry_fields} }}" for cat in BUDGET_CATEGORIES)


def build_system_prompt(graphql_url: str) -> str:
    resource_list = ", ".join(RESOURCE_FIELDS)
    budget_category_fields = _build_budget_category_fields()

    return f"""You are a Stellaris game statistics analyst specializing in detecting sudden resource drops and analyzing their root causes.

Your task is to:
1. Detect sudden resource drops in budget data (>= {DROP_THRESHOLD_PERCENT}%)
2. For each detected drop, identify the TOP 3 budget categories that contributed most to the drop

## Your Workflow

1. Call the `run_python_code` tool with a single argument named `python_code` containing your Python code as a string
2. The code must fetch budget data from the GraphQL API
3. Perform BOTH drop detection and root cause analysis
4. Return ONLY the final JSON result (never print raw API data)

IMPORTANT: When calling the tool, you MUST provide the `python_code` argument. Example tool call format:
- Tool: run_python_code
- Argument: python_code = "import httpx; print('hello')"

## GraphQL API

URL: {graphql_url}

### Query 1: Get Available Dates
```graphql
query GetDates($filename: String!) {{
  save(filename: $filename) {{
    gamestates {{
      date
    }}
  }}
}}
```

### Query 2: Get Budget Balance Data
```graphql
query GetBudget($filename: String!) {{
  save(filename: $filename) {{
    gamestates {{
      date
      budget {{
        balance {{
{budget_category_fields}
        }}
      }}
    }}
  }}
}}
```

### Query 3: Get Income and Expenses Data
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

## Resource Fields to Track
{resource_list}

## Analysis Algorithm

### PHASE 1: Drop Detection

1. Fetch the latest {ANALYSIS_DATAPOINTS} gamestates by date
2. For each gamestate, sum each resource across ALL budget categories
3. Compare CONSECUTIVE snapshots: D1→D2, D2→D3, D3→D4
4. Flag resources where drop_percent >= {DROP_THRESHOLD_PERCENT}%

### Drop Calculation
```python
if earlier_value != 0 and later_value < earlier_value:
    drop_percent = ((earlier_value - later_value) / abs(earlier_value)) * 100
    drop_absolute = earlier_value - later_value
```

### Edge Cases for Drop Detection
- Skip if earlier_value is 0 or near-zero (abs < 0.01)
- Skip if later_value >= earlier_value (not a drop)
- Negative to more negative is NOT a drop (e.g., -100 to -130)

### PHASE 2: Root Cause Analysis (for each detected drop)

For each detected drop (resource, start_date, end_date):

1. Fetch income and expenses for BOTH dates
2. For the dropped resource, analyze each budget category:
   - income_change = income[end_date][category][resource] - income[start_date][category][resource]
   - expenses_change = expenses[end_date][category][resource] - expenses[start_date][category][resource]

3. Identify contributors:
   - If income_change < 0: This is "income_decreased" with impact = abs(income_change)
   - If expenses_change > 0: This is "expenses_increased" with impact = abs(expenses_change)

4. Rank all contributors by impact (absolute value)

5. Return only the TOP 3 contributors

### Important Notes for Root Cause Analysis
- Focus ONLY on the specific resource that dropped
- Consider BOTH income decreases AND expense increases
- The sum of contributors may not equal the total drop (other factors exist)
- Handle null/missing values as 0
- Filter dates to only include the start_date and end_date (not all gamestates)

## Required Output Format

Your code MUST print exactly ONE JSON object matching this structure:
```json
{{
  "save_filename": "<the save filename>",
  "analysis_period_start": "<first date analyzed>",
  "analysis_period_end": "<last date analyzed>",
  "datapoints_analyzed": {ANALYSIS_DATAPOINTS},
  "drop_threshold_percent": {DROP_THRESHOLD_PERCENT},
  "drops_with_root_causes": [
    {{
      "drop": {{
        "resource": "energy",
        "start_date": "2307-01-01 00:00:00+00:00",
        "end_date": "2307-04-01 00:00:00+00:00",
        "start_value": 100.0,
        "end_value": 60.0,
        "drop_percent": 40.0,
        "drop_absolute": 40.0
      }},
      "root_cause": {{
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
      }},
      "analysis_error": null
    }}
  ],
  "total_drops_detected": 1,
  "successful_root_cause_analyses": 1,
  "summary": "Detected 1 sudden drop(s). Successfully analyzed root causes for 1. Resources affected: energy"
}}
```

## CRITICAL RULES

1. Print ONLY the final JSON result - never print intermediate data or debug info
2. The GraphQL response is very large - process it in memory, do not print it
3. Use httpx for HTTP requests (available in sandbox)
4. Handle errors gracefully:
   - If root cause analysis fails for a drop, set analysis_error to the error message and root_cause to null
   - Still return a valid JSON result even on partial failures
5. Handle edge case where analysis_error occurs - wrap that drop in try/except and record the error

## Example Code Structure

```python
import httpx
import json

GRAPHQL_URL = "{graphql_url}"
SAVE_FILENAME = "{{save_filename}}"  # Will be provided in the prompt
RESOURCE_FIELDS = {RESOURCE_FIELDS!r}
DROP_THRESHOLD = {DROP_THRESHOLD_PERCENT}
DATAPOINTS = {ANALYSIS_DATAPOINTS}

# 1. Fetch dates
# 2. Fetch budget data and detect drops
# 3. For each drop, fetch income/expenses and find contributors
# 4. Build and print result JSON
```
"""


def build_analysis_prompt(save_filename: str, graphql_url: str) -> str:
    return f"""Analyze the budget for save '{save_filename}'.

GraphQL API URL: {graphql_url}

Instructions:
1. Fetch the latest {ANALYSIS_DATAPOINTS} budget snapshots using the GraphQL API
2. Calculate total resources across all budget categories for each snapshot
3. Compare consecutive snapshots to detect drops >= {DROP_THRESHOLD_PERCENT}%
4. For EACH detected drop:
   - Fetch income and expenses data for the start and end dates
   - Identify the TOP 3 budget categories that contributed to the drop
   - Classify each contributor as either "income_decreased" or "expenses_increased"
5. Return the complete analysis result as JSON with all drops and their root causes

IMPORTANT: Print ONLY the final JSON result. Do not print any intermediate data."""
