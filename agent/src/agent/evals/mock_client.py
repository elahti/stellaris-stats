from dataclasses import dataclass, field

from agent.graphql_client import (
    GetBudget,
    GetDates,
    ListSaves,
)


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

    async def list_saves(self, **_kwargs: object) -> ListSaves:
        return self.list_saves_response

    async def get_dates(self, filename: str, **_kwargs: object) -> GetDates:
        return self.get_dates_responses.get(filename, GetDates(save=None))

    async def get_budget(self, filename: str, **_kwargs: object) -> GetBudget:
        return self.get_budget_responses.get(filename, GetBudget(save=None))
