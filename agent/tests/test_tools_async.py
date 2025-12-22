from datetime import datetime

from agent.budget_agent.tools import get_available_dates, list_saves
from agent.evals.mock_client import MockClient
from agent.graphql_client import (
    GetDates,
    GetDatesSave,
    GetDatesSaveGamestates,
    ListSaves,
    ListSavesSaves,
)


class TestGetAvailableDates:
    async def test_returns_empty_list_when_save_not_found(self) -> None:
        client = MockClient()
        result = await get_available_dates(client, "unknown.sav")
        assert result == []

    async def test_returns_sorted_dates(self) -> None:
        gamestates = [
            GetDatesSaveGamestates(date=datetime(2200, 3, 1)),
            GetDatesSaveGamestates(date=datetime(2200, 1, 1)),
            GetDatesSaveGamestates(date=datetime(2200, 2, 1)),
        ]
        client = MockClient(
            get_dates_responses={
                "test.sav": GetDates(save=GetDatesSave(gamestates=gamestates)),
            },
        )

        result = await get_available_dates(client, "test.sav")
        assert result == [
            "2200-01-01 00:00:00",
            "2200-02-01 00:00:00",
            "2200-03-01 00:00:00",
        ]

    async def test_returns_single_date(self) -> None:
        gamestates = [GetDatesSaveGamestates(date=datetime(2200, 5, 15))]
        client = MockClient(
            get_dates_responses={
                "test.sav": GetDates(save=GetDatesSave(gamestates=gamestates)),
            },
        )

        result = await get_available_dates(client, "test.sav")
        assert result == ["2200-05-15 00:00:00"]

    async def test_returns_empty_when_save_has_no_gamestates(self) -> None:
        client = MockClient(
            get_dates_responses={
                "test.sav": GetDates(save=GetDatesSave(gamestates=[])),
            },
        )

        result = await get_available_dates(client, "test.sav")
        assert result == []


class TestListSaves:
    async def test_returns_empty_list_when_no_saves(self) -> None:
        client = MockClient()
        result = await list_saves(client)
        assert result == []

    async def test_returns_saves_from_client(self) -> None:
        saves = [
            ListSavesSaves(filename="save1.sav", name="Empire 1"),
            ListSavesSaves(filename="save2.sav", name="Empire 2"),
        ]
        client = MockClient(list_saves_response=ListSaves(saves=saves))

        result = await list_saves(client)
        assert len(result) == 2
        assert result[0].filename == "save1.sav"
        assert result[0].name == "Empire 1"
        assert result[1].filename == "save2.sav"
        assert result[1].name == "Empire 2"

    async def test_returns_single_save(self) -> None:
        saves = [ListSavesSaves(filename="only.sav", name="Only Empire")]
        client = MockClient(list_saves_response=ListSaves(saves=saves))

        result = await list_saves(client)
        assert len(result) == 1
        assert result[0].filename == "only.sav"
