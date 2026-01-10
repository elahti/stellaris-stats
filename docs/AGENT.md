# Budget Analysis Agent

The budget analysis agent is a Python-based AI agent that analyzes Stellaris empire budget data to detect sudden resource drops.

## Agent Architecture

### Components

- **Budget Agent** (`agent/src/agent/budget_agent/agent.py`): Main agent with sudden drop detection
- **Tools** (`agent/src/agent/budget_agent/tools.py`): GraphQL data fetching and analysis functions
- **Models** (`agent/src/agent/budget_agent/models.py`): Pydantic models for structured outputs
- **CLI** (`agent/src/agent/cli.py`): Command-line interface entry point

### Data Flow

1. User invokes CLI with save filename
2. Agent fetches the 4 most recent budget snapshots from GraphQL API
3. For each snapshot, sums resource values across all budget categories
4. Compares resource totals between first (D1) and last (D4) snapshots
5. Flags resources with 30%+ drops as sudden drops
6. Returns structured result with detected sudden drops

### Configuration

- **Drop Threshold**: 30% drop triggers detection
- **Analysis Window**: 4 most recent datapoints (D1 to D4 comparison)
- **Model**: `openai:gpt-5.2-2025-12-11`
- **API Key**: `ANTHROPIC_API_KEY` or `STELLARIS_STATS_ANTHROPIC_API_KEY` environment variable (loaded via dotenvx from `.env.stellaris-stats.secrets`)

### Structured Output

```python
class SuddenDropAnalysisResult(BaseModel):
    save_filename: str
    analysis_period_start: str
    analysis_period_end: str
    datapoints_analyzed: int
    drop_threshold_percent: float
    sudden_drops: list[SuddenDrop]
    summary: str
```

## Evaluation Framework

The agent includes a pydantic-evals based evaluation framework for testing agent behavior.

### Components

- **Runner** (`agent/src/agent/evals/runner.py`): Orchestrates evaluation runs with mock GraphQL client
- **Mock Client** (`agent/src/agent/evals/mock_client.py`): Replaces live GraphQL with fixture data
- **Evaluators** (`agent/src/agent/evals/evaluators/`): Custom evaluators for output validation
- **Datasets** (`agent/src/agent/evals/datasets/`): Test cases with inputs and expected outcomes
- **CLI** (`agent/src/agent/evals/cli.py`): Command-line interface for running evals

### Available Datasets

- `multi_agent_drop_detection`: Tests multi-agent workflow for detecting sudden resource drops and root cause analysis

### Running Evals

```bash
npm run agent:evals -- --dataset multi_agent_drop_detection
npm run agent:evals -- --dataset multi_agent_drop_detection --model anthropic:claude-haiku-3-5-20241022
npm run agent:evals -- --list-datasets
npm run agent:evals -- --list-models
```

### Adding New Datasets

1. Create fixture using `npm run agent:generate-fixture`
2. Add dataset file in `agent/src/agent/evals/datasets/`
3. Register in `agent/src/agent/evals/cli.py` AVAILABLE_DATASETS
