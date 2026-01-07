from agent.analysis_config import (
    ANALYSIS_DATAPOINTS,
    BUDGET_CATEGORIES,
    DROP_THRESHOLD_PERCENT,
    RESOURCE_FIELDS,
)


def _build_budget_entry_fields() -> str:
    return " ".join(RESOURCE_FIELDS)


def _build_budget_category_fields() -> str:
    entry_fields = _build_budget_entry_fields()
    return "\n".join(f"  {cat} {{ {entry_fields} }}" for cat in BUDGET_CATEGORIES)


def build_system_prompt(graphql_url: str) -> str:
    resource_list = ", ".join(RESOURCE_FIELDS)
    budget_category_fields = _build_budget_category_fields()

    return f"""You are a Stellaris game statistics analyst. Your task is to detect sudden resource drops in budget data.

## Your Workflow

1. Call the `run_python_code` tool with a single argument named `python_code` containing your Python code as a string
2. The code must fetch budget data from the GraphQL API and analyze it
3. Return ONLY the final JSON result (never print raw API data)

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

### Query 2: Get Budget Data
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

## Resource Fields to Track
{resource_list}

## Analysis Algorithm

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

### Edge Cases
- Skip if earlier_value is 0 or near-zero (abs < 0.01)
- Skip if later_value >= earlier_value (not a drop)
- Negative to more negative is NOT a drop (e.g., -100 to -130)

## Required Output Format

Your code MUST print exactly ONE JSON object matching this structure:
```json
{{
  "save_filename": "<the save filename>",
  "analysis_period_start": "<first date analyzed>",
  "analysis_period_end": "<last date analyzed>",
  "datapoints_analyzed": {ANALYSIS_DATAPOINTS},
  "drop_threshold_percent": {DROP_THRESHOLD_PERCENT},
  "sudden_drops": [
    {{
      "resource": "energy",
      "start_date": "2307-01-01 00:00:00+00:00",
      "end_date": "2307-04-01 00:00:00+00:00",
      "start_value": 100.0,
      "end_value": 60.0,
      "drop_percent": 40.0,
      "drop_absolute": 40.0
    }}
  ],
  "summary": "Found 1 sudden drop(s): energy"
}}
```

## CRITICAL RULES

1. Print ONLY the final JSON result - never print intermediate data or debug info
2. The GraphQL response is very large - process it in memory, do not print it
3. Use httpx for HTTP requests (available in sandbox)
4. Handle errors gracefully and return a valid JSON result even on failure

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
dates_query = '''
query GetDates($filename: String!) {{
  save(filename: $filename) {{ gamestates {{ date }} }}
}}
'''

with httpx.Client(timeout=180.0) as client:
    resp = client.post(GRAPHQL_URL, json={{
        "query": dates_query,
        "variables": {{"filename": SAVE_FILENAME}}
    }})
    dates_data = resp.json()

all_dates = sorted([gs["date"] for gs in dates_data["data"]["save"]["gamestates"]])
selected_dates = all_dates[-DATAPOINTS:]

# 2. Fetch budget data (use the full query from above)
# 3. Sum resources per snapshot
# 4. Detect drops between consecutive snapshots
# 5. Build and print result JSON

result = {{...}}
print(json.dumps(result))
```
"""


def build_analysis_prompt(save_filename: str, graphql_url: str) -> str:
    return f"""Analyze the budget for save '{save_filename}'.

GraphQL API URL: {graphql_url}

Instructions:
1. Fetch the latest {ANALYSIS_DATAPOINTS} budget snapshots using the GraphQL API
2. Calculate total resources across all budget categories for each snapshot
3. Compare consecutive snapshots to detect drops >= {DROP_THRESHOLD_PERCENT}%
4. Return the analysis result as JSON

IMPORTANT: Print ONLY the final JSON result. Do not print any intermediate data."""
