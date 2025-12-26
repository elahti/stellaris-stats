import pytest

from agent.budget_agent.tools import AgentDeps
from agent.evals.mock_client import MockClient


@pytest.fixture
def empty_mock_client() -> MockClient:
    return MockClient()


@pytest.fixture
def agent_deps(empty_mock_client: MockClient) -> AgentDeps:
    return AgentDeps(client=empty_mock_client)
