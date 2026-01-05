from dataclasses import dataclass
from typing import Protocol

from agent.graphql_client import (
    GetBudget,
    GetBudgetSaveGamestates,
    GetDates,
    ListSaves,
    ListSavesSaves,
)
from agent.settings import Settings, get_settings


class GraphQLClientProtocol(Protocol):
    """Protocol defining the subset of GraphQL client methods used by the agent."""

    async def list_saves(self, **kwargs: object) -> ListSaves: ...

    async def get_dates(self, filename: str, **kwargs: object) -> GetDates: ...

    async def get_budget(self, filename: str, **kwargs: object) -> GetBudget: ...


@dataclass
class AgentDeps:
    """Dependencies injected into the budget analysis agent."""

    client: GraphQLClientProtocol


def create_deps(
    client: GraphQLClientProtocol | None = None,
    settings: Settings | None = None,
) -> AgentDeps:
    if settings is None:
        settings = get_settings()
    if client is None:
        client = settings.create_graphql_client()
    return AgentDeps(client=client)


async def list_saves(client: GraphQLClientProtocol) -> list[ListSavesSaves]:
    result = await client.list_saves()
    return result.saves


async def get_available_dates(
    client: GraphQLClientProtocol,
    filename: str,
) -> list[str]:
    result = await client.get_dates(filename=filename)
    if result.save is None:
        return []
    dates = sorted([str(gs.date) for gs in result.save.gamestates])
    return dates


def select_latest_dates(dates: list[str], count: int = 6) -> list[str]:
    return dates[-count:] if len(dates) >= count else dates


async def fetch_budget_data(client: GraphQLClientProtocol, filename: str) -> GetBudget:
    return await client.get_budget(filename=filename)


def get_gamestates_for_dates(
    budget_data: GetBudget,
    dates: list[str],
) -> list[GetBudgetSaveGamestates] | None:
    if budget_data.save is None:
        return None

    gamestates: list[GetBudgetSaveGamestates] = []
    for date in dates:
        gs = next(
            (g for g in budget_data.save.gamestates if str(g.date) == date),
            None,
        )
        if gs is None:
            return None
        gamestates.append(gs)
    return gamestates
