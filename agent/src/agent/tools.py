from dataclasses import dataclass
from typing import Any, Protocol

from agent.graphql_client import (
    Client,
    GetBudget,
    GetBudgetSaveGamestates,
    GetDates,
    ListSaves,
    ListSavesSaves,
)

GRAPHQL_URL = "http://devcontainer:4000"


class GraphQLClientProtocol(Protocol):
    async def list_saves(self, **kwargs: Any) -> ListSaves: ...

    async def get_dates(self, filename: str, **kwargs: Any) -> GetDates: ...

    async def get_budget(self, filename: str, **kwargs: Any) -> GetBudget: ...


@dataclass
class AgentDeps:
    client: GraphQLClientProtocol
    threshold_percent: float = 15.0


def create_deps(client: Client | None = None) -> AgentDeps:
    if client is None:
        client = Client(url=GRAPHQL_URL)
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


def find_comparison_dates(dates: list[str]) -> tuple[str, str] | None:
    if len(dates) < 2:
        return None

    latest_date = dates[-1]
    latest_year = int(latest_date[:4])
    target_year = latest_year - 1

    one_year_prior = None
    for date in dates:
        year = int(date[:4])
        if year <= target_year:
            one_year_prior = date
        else:
            break

    if one_year_prior is None:
        one_year_prior = dates[0]

    return (one_year_prior, latest_date)


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
