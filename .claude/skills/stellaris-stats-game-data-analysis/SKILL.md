---
name: stellaris-stats-game-data-analysis
description: Analyzes Stellaris save data by creating and running python code using a MCP tool providing a sandboxed environment. The Python code retrieves data from Stellaris saves by accessing GraphQL API.
allowed-tools: python-executor
---

# Stellaris Game Data Analysis

This skill instructs how to analyze Stellaris save data without filling LLM context with data from the GraphQL API.

## When To Use This Skill

You must use this skill whenever the user asks questions about analyzing their Stellaris save data.

Invoke this skill when the user asks about:

- Stellaris game statistics or save file data
- Economic trends, resource income, or budget analysis
- Military strength, fleet composition, or war statistics
- Diplomatic relations or empire comparisons
- Any data-driven analysis of Stellaris gameplay

## How To Use This Skill

Stellaris save data is available via a GraphQL API. You must first understand the GraphQL schema to know how the data is structured.

- You must create one or more Python programs with the purpose of introspecting the GraphQL schema.
- Use the `python-executor` MCP tool to create and run one or more Python programs.
- These Python programs are allowed to return complete introspection results to you.

After you've gained understanding of the schema, you must start analyzing Stellaris save data as the user has requested.

- You must create one or more Python programs with the purpose of querying the GraphQL API and extracting only needed data out of query results.
- You aren't allowed to return full set of query data from Python programs that you create to prevent LLM context getting filled up.
- Instead, you must process the GraphQL query results in the Python program and only return what you need.

If you don't manage to produce correct results:

- You are allowed to repeat the process of introspecting the schema and querying and analyzing the data.
- You can also create several programs of either kind if you don't need to repeat the whole process.

## Examples

### Example 1: Introspecting GraphQL Schema

When you need to understand the available data structure, use this pattern:

```python
import requests

url = 'http://devcontainer:4000'

introspection_query = '''
query IntrospectionQuery {
  __schema {
    queryType { name }
    types {
      name
      kind
      description
      fields(includeDeprecated: true) {
        name
        description
        type {
          name
          kind
          ofType {
            name
            kind
            ofType {
              name
              kind
              ofType {
                name
                kind
              }
            }
          }
        }
      }
    }
  }
}
'''

response = requests.post(url, json={'query': introspection_query})
schema = response.json()

schema
```

### Example 2: Querying And Filtering Save Data

When analyzing specific game data for a particular date:

```python
import requests

url = 'http://devcontainer:4000'
filename = 'commonwealthofman_1251622081'
target_date = '2263-09-01T00:00:00.000Z'

query = '''
query StarbaseModules($filename: String!) {
  save(filename: $filename) {
    gamestates {
      date
      budget {
        income {
          starbaseModules {
            energy
            food
          }
        }
      }
    }
  }
}
'''

response = requests.post(url, json={
    'query': query,
    'variables': {'filename': filename}
})

data = response.json()

gamestates = data['data']['save']['gamestates']
target_gamestate = next(gs for gs in gamestates if gs['date'] == target_date)

energy = target_gamestate['budget']['income']['starbaseModules']['energy']
food = target_gamestate['budget']['income']['starbaseModules']['food']

{'energy': energy, 'food': food}
```

### Example 3: Typical Workflow

1. User asks: "What's my energy income from starbases in save 'myempire_12345'?"
2. You introspect the schema to find relevant fields
3. You query for all gamestates for that save
4. You filter to the latest date (or user-specified date)
5. You extract the specific data requested
6. You present it in a clear markdown table with historical comparison if applicable
