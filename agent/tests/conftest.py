from pathlib import Path

import pytest

from agent.budget_agent.tools import AgentDeps
from agent.evals.mock_client import (
    Fixture,
    MockClient,
    create_mock_client,
    load_fixture,
)

FIXTURES_DIR = Path(__file__).parent.parent / "src" / "agent" / "evals" / "fixtures"


@pytest.fixture
def empty_mock_client() -> MockClient:
    return MockClient()


@pytest.fixture
def sample_fixture_path() -> Path:
    return FIXTURES_DIR / "sudden_drop_detection" / "stable_energy_balance.json"


@pytest.fixture
def sample_fixture(sample_fixture_path: Path) -> Fixture:
    return load_fixture(sample_fixture_path)


@pytest.fixture
def mock_client_from_fixture(sample_fixture: Fixture) -> MockClient:
    client = create_mock_client(sample_fixture)
    assert isinstance(client, MockClient)
    return client


@pytest.fixture
def agent_deps(mock_client_from_fixture: MockClient) -> AgentDeps:
    return AgentDeps(client=mock_client_from_fixture)
