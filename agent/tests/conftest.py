from pathlib import Path
from typing import Any

import pytest

from agent.graphql_client import (
    GetBudget,
    GetDates,
    ListSaves,
    ListSavesSaves,
)
from agent.native_budget_agent.tools import AgentDeps

FIXTURES_DIR = Path(__file__).parent.parent / "src/agent/evals/fixtures"


class MockClient:
    def __init__(
        self,
        saves: list[ListSavesSaves] | None = None,
        budgets: dict[str, GetBudget] | None = None,
        dates: dict[str, GetDates] | None = None,
    ) -> None:
        super().__init__()
        self.saves: list[ListSavesSaves] = saves if saves is not None else []
        self.budgets: dict[str, GetBudget] = budgets if budgets is not None else {}
        self.dates: dict[str, GetDates] = dates if dates is not None else {}

    async def list_saves(self, **kwargs: object) -> ListSaves:
        return ListSaves(saves=self.saves)

    async def get_dates(self, filename: str, **kwargs: object) -> GetDates:
        return self.dates.get(filename, GetDates(save=None))

    async def get_budget(self, filename: str, **kwargs: object) -> GetBudget:
        return self.budgets.get(filename, GetBudget(save=None))


@pytest.fixture
def empty_mock_client() -> MockClient:
    return MockClient()


@pytest.fixture
def mock_client_with_saves() -> MockClient:
    return MockClient(
        saves=[
            ListSavesSaves(filename="test1.sav", name="Test Empire 1"),
            ListSavesSaves(filename="test2.sav", name="Test Empire 2"),
        ],
    )


@pytest.fixture
def agent_deps(empty_mock_client: MockClient) -> AgentDeps:
    return AgentDeps(client=empty_mock_client)


@pytest.fixture
def agent_deps_with_saves(mock_client_with_saves: MockClient) -> AgentDeps:
    return AgentDeps(client=mock_client_with_saves)


def create_mock_client(
    saves: list[dict[str, Any]] | None = None,
    budgets: dict[str, Any] | None = None,
    dates: dict[str, Any] | None = None,
) -> MockClient:
    client = MockClient()
    if saves:
        client.saves = [ListSavesSaves(**s) for s in saves]
    return client
