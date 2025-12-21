import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from agent.graphql_client import (
    GetBudget,
    GetDates,
    ListSaves,
)
from agent.tools import GraphQLClientProtocol


@dataclass
class MockClient:
    """Mock GraphQL client that returns pre-configured responses for testing."""

    list_saves_response: ListSaves = field(
        default_factory=lambda: ListSaves(saves=[]),
    )
    get_dates_responses: dict[str, GetDates] = field(
        default_factory=lambda: {},
    )
    get_budget_responses: dict[str, GetBudget] = field(
        default_factory=lambda: {},
    )

    async def list_saves(self, **_kwargs: Any) -> ListSaves:
        return self.list_saves_response

    async def get_dates(self, filename: str, **_kwargs: Any) -> GetDates:
        return self.get_dates_responses.get(filename, GetDates(save=None))

    async def get_budget(self, filename: str, **_kwargs: Any) -> GetBudget:
        return self.get_budget_responses.get(filename, GetBudget(save=None))


@dataclass
class Fixture:
    """Test fixture containing mock GraphQL responses loaded from JSON."""

    metadata: dict[str, Any]
    list_saves: ListSaves
    get_dates: dict[str, GetDates]
    get_budget: dict[str, GetBudget]


def load_fixture(fixture_path: str | Path) -> Fixture:
    fixture_data: dict[str, Any] = json.loads(Path(fixture_path).read_text())

    list_saves = ListSaves.model_validate(fixture_data.get("list_saves", {"saves": []}))

    get_dates_responses: dict[str, GetDates] = {}
    for filename, data in fixture_data.get("get_dates", {}).items():
        get_dates_responses[str(filename)] = GetDates.model_validate(data)

    get_budget_responses: dict[str, GetBudget] = {}
    for filename, data in fixture_data.get("get_budget", {}).items():
        get_budget_responses[str(filename)] = GetBudget.model_validate(data)

    return Fixture(
        metadata=fixture_data.get("metadata", {}),
        list_saves=list_saves,
        get_dates=get_dates_responses,
        get_budget=get_budget_responses,
    )


def create_mock_client(fixture: Fixture) -> GraphQLClientProtocol:
    return MockClient(
        list_saves_response=fixture.list_saves,
        get_dates_responses=fixture.get_dates,
        get_budget_responses=fixture.get_budget,
    )
