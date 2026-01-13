# Budget Analysis Agent System

The agent system provides AI-powered analysis of Stellaris empire budget data. Multiple agent implementations exist for different analysis approaches.

## Agent Types

| Agent             | Directory                            | Purpose                                         |
| ----------------- | ------------------------------------ | ----------------------------------------------- |
| native_budget     | `agent/src/agent/native_budget/`     | pydantic-ai agent with native Python tools      |
| sandbox           | `agent/src/agent/sandbox/`           | Uses MCP python executor for sandboxed analysis |
| neighbor_single   | `agent/src/agent/neighbor_single/`   | Single-agent neighbor empire analysis           |
| neighbor_multi    | `agent/src/agent/neighbor_multi/`    | Multi-agent orchestrated neighbor analysis      |
| root_cause_single | `agent/src/agent/root_cause_single/` | Single-agent root cause analysis                |
| root_cause_multi  | `agent/src/agent/root_cause_multi/`  | Multi-agent orchestrated root cause analysis    |

## Shared Patterns

### Lazy Agent Initialization

Agents must be lazily initialized to allow utility commands (`list-models`, `--help`) to work without API keys. See the code example in `CLAUDE.md` under "Python Agent Pattern".

### Dependency Injection

All agents use an `AgentDeps` dataclass for dependency injection:

```python
@dataclass
class AgentDeps:
    client: GraphQLClientProtocol
```

This allows swapping the GraphQL client for testing (MockClient) or production (real client).

### Structured Output

Agents return Pydantic models for type-safe structured output:

```python
class SuddenDropAnalysisResult(BaseModel):
    save_filename: str
    analysis_period_start: str
    analysis_period_end: str
    sudden_drops: list[SuddenDrop]
    summary: str
```

### GraphQL Data Fetching

Agents fetch data via the generated GraphQL client in `agent/src/agent/graphql_client/`. Queries are defined in `agent/queries.graphql`.

## Running Agents

See the Python commands table in `CLAUDE.md`. Key commands:

- `npm run agent:analyze -- --type budget --save <filename>`
- `npm run agent:analyze -- --type neighbors --save <filename>`
- `npm run agent:list-saves`
- `npm run agent:list-models`

## Running Evals

Discover available datasets:

```bash
npm run agent:evals -- --list-datasets
```

Run a specific dataset:

```bash
npm run agent:evals -- --dataset <name>
```

For eval infrastructure details (template databases, fixtures, runners), see `docs/TESTING.md`.

## Adding New Agents

Follow the existing agent structure:

1. Create directory under `agent/src/agent/<agent_name>/`
2. Add `__init__.py` with public exports
3. Add `agent.py` with lazy initialization pattern
4. Add `models.py` for Pydantic input/output models
5. Add `prompts.py` if agent needs dynamic prompts
6. Register in CLI if needed (`agent/src/agent/cli.py`)
7. Add eval dataset and runner if testing agent behavior
