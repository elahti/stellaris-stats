from datetime import UTC, datetime
from typing import Any
from unittest.mock import MagicMock

import pytest

from agent.graphql_client import (
    GetBudget,
    GetDates,
    GetDatesSave,
    GetDatesSaveGamestates,
    ListSavesSaves,
)
from agent.native_budget_agent.tools import (
    AgentDeps,
    get_available_dates,
    get_gamestates_for_dates,
    list_saves,
    select_latest_dates,
)

from .conftest import MockClient


class TestSelectLatestDates:
    def test_returns_last_n_dates(self) -> None:
        dates = ["2200-01-01", "2200-02-01", "2200-03-01", "2200-04-01", "2200-05-01"]
        result = select_latest_dates(dates, count=3)
        assert result == ["2200-03-01", "2200-04-01", "2200-05-01"]

    def test_returns_all_dates_when_fewer_than_count(self) -> None:
        dates = ["2200-01-01", "2200-02-01"]
        result = select_latest_dates(dates, count=6)
        assert result == ["2200-01-01", "2200-02-01"]

    def test_returns_exact_count_when_equal(self) -> None:
        dates = ["2200-01-01", "2200-02-01", "2200-03-01"]
        result = select_latest_dates(dates, count=3)
        assert result == ["2200-01-01", "2200-02-01", "2200-03-01"]

    def test_returns_empty_list_for_empty_input(self) -> None:
        result = select_latest_dates([], count=6)
        assert result == []

    def test_default_count_is_six(self) -> None:
        dates = [f"2200-{i:02d}-01" for i in range(1, 10)]
        result = select_latest_dates(dates)
        assert len(result) == 6
        assert result == dates[-6:]


class TestGetGamestatesForDates:
    def test_returns_gamestates_for_matching_dates(self) -> None:
        gamestate1 = _create_mock_gamestate("2200-01-01")
        gamestate2 = _create_mock_gamestate("2200-02-01")
        budget_data = _create_mock_budget_data([gamestate1, gamestate2])

        result = get_gamestates_for_dates(budget_data, ["2200-01-01", "2200-02-01"])

        assert result is not None
        assert len(result) == 2
        assert str(result[0].date) == "2200-01-01"
        assert str(result[1].date) == "2200-02-01"

    def test_returns_none_when_save_is_none(self) -> None:
        budget_data = GetBudget(save=None)
        result = get_gamestates_for_dates(budget_data, ["2200-01-01"])
        assert result is None

    def test_returns_none_when_date_not_found(self) -> None:
        gamestate = _create_mock_gamestate("2200-01-01")
        budget_data = _create_mock_budget_data([gamestate])

        result = get_gamestates_for_dates(budget_data, ["2200-01-01", "2200-02-01"])
        assert result is None

    def test_returns_empty_list_for_empty_dates(self) -> None:
        gamestate = _create_mock_gamestate("2200-01-01")
        budget_data = _create_mock_budget_data([gamestate])

        result = get_gamestates_for_dates(budget_data, [])
        assert result == []


class TestListSaves:
    @pytest.mark.asyncio
    async def test_returns_saves_from_client(self) -> None:
        mock_client = MockClient(
            saves=[
                ListSavesSaves(filename="save1.sav", name="Empire 1"),
                ListSavesSaves(filename="save2.sav", name="Empire 2"),
            ],
        )

        result = await list_saves(mock_client)

        assert len(result) == 2
        assert result[0].filename == "save1.sav"
        assert result[1].name == "Empire 2"

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_saves(self) -> None:
        mock_client = MockClient(saves=[])
        result = await list_saves(mock_client)
        assert result == []


class TestGetAvailableDates:
    @pytest.mark.asyncio
    async def test_returns_sorted_dates(self) -> None:
        mock_client = MockClient(
            dates={
                "test.sav": GetDates(
                    save=GetDatesSave(
                        gamestates=[
                            GetDatesSaveGamestates(
                                date=datetime(2200, 3, 1, tzinfo=UTC),
                            ),
                            GetDatesSaveGamestates(
                                date=datetime(2200, 1, 1, tzinfo=UTC),
                            ),
                            GetDatesSaveGamestates(
                                date=datetime(2200, 2, 1, tzinfo=UTC),
                            ),
                        ],
                    ),
                ),
            },
        )

        result = await get_available_dates(mock_client, "test.sav")

        assert len(result) == 3
        assert result[0] < result[1] < result[2]

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_save_not_found(self) -> None:
        mock_client = MockClient(dates={})
        result = await get_available_dates(mock_client, "nonexistent.sav")
        assert result == []


class TestAgentDeps:
    def test_can_create_with_mock_client(self) -> None:
        mock_client = MockClient()
        deps = AgentDeps(client=mock_client)
        assert deps.client is mock_client


def _create_mock_gamestate(date_str: str) -> Any:
    mock = MagicMock()
    mock.date = date_str
    mock.budget = MagicMock()
    return mock


def _create_mock_budget_data(gamestates: list[Any]) -> Any:
    mock = MagicMock(spec=GetBudget)
    mock.save = MagicMock()
    mock.save.gamestates = gamestates
    return mock
