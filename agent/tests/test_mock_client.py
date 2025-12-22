from pathlib import Path

import pytest

from agent.evals.mock_client import (
    Fixture,
    MockClient,
    create_mock_client,
    load_fixture,
)
from agent.graphql_client import (
    GetBudget,
    GetBudgetSave,
    GetDates,
    GetDatesSave,
    GetDatesSaveGamestates,
    ListSaves,
    ListSavesSaves,
)


class TestMockClient:
    async def test_list_saves_returns_empty_by_default(self) -> None:
        client = MockClient()
        result = await client.list_saves()
        assert result.saves == []

    async def test_get_dates_returns_none_save_for_unknown_filename(self) -> None:
        client = MockClient()
        result = await client.get_dates(filename="unknown.sav")
        assert result.save is None

    async def test_get_budget_returns_none_save_for_unknown_filename(self) -> None:
        client = MockClient()
        result = await client.get_budget(filename="unknown.sav")
        assert result.save is None

    async def test_list_saves_returns_configured_saves(self) -> None:
        saves = [
            ListSavesSaves(filename="save1.sav", name="Empire 1"),
            ListSavesSaves(filename="save2.sav", name="Empire 2"),
        ]
        client = MockClient(list_saves_response=ListSaves(saves=saves))
        result = await client.list_saves()
        assert len(result.saves) == 2
        assert result.saves[0].filename == "save1.sav"

    async def test_get_dates_returns_configured_response(self) -> None:
        from datetime import datetime

        gamestates = [GetDatesSaveGamestates(date=datetime(2200, 1, 1))]
        client = MockClient(
            get_dates_responses={
                "test.sav": GetDates(save=GetDatesSave(gamestates=gamestates)),
            },
        )
        result = await client.get_dates(filename="test.sav")
        assert result.save is not None
        assert len(result.save.gamestates) == 1

    async def test_get_budget_returns_configured_response(self) -> None:
        client = MockClient(
            get_budget_responses={
                "test.sav": GetBudget(save=GetBudgetSave(gamestates=[])),
            },
        )
        result = await client.get_budget(filename="test.sav")
        assert result.save is not None


class TestLoadFixture:
    def test_loads_valid_fixture_file(self, sample_fixture_path: Path) -> None:
        fixture = load_fixture(sample_fixture_path)
        assert isinstance(fixture, Fixture)
        assert fixture.list_saves is not None

    def test_raises_on_nonexistent_file(self) -> None:
        with pytest.raises(FileNotFoundError):
            load_fixture("/nonexistent/path.json")

    def test_fixture_has_metadata(self, sample_fixture_path: Path) -> None:
        fixture = load_fixture(sample_fixture_path)
        assert isinstance(fixture.metadata, dict)

    def test_fixture_has_list_saves(self, sample_fixture_path: Path) -> None:
        fixture = load_fixture(sample_fixture_path)
        assert isinstance(fixture.list_saves, ListSaves)

    def test_fixture_has_get_dates(self, sample_fixture_path: Path) -> None:
        fixture = load_fixture(sample_fixture_path)
        assert isinstance(fixture.get_dates, dict)

    def test_fixture_has_get_budget(self, sample_fixture_path: Path) -> None:
        fixture = load_fixture(sample_fixture_path)
        assert isinstance(fixture.get_budget, dict)


class TestCreateMockClient:
    def test_creates_client_from_fixture(self, sample_fixture: Fixture) -> None:
        client = create_mock_client(sample_fixture)
        assert client is not None

    async def test_client_returns_fixture_list_saves(
        self,
        sample_fixture: Fixture,
    ) -> None:
        client = create_mock_client(sample_fixture)
        result = await client.list_saves()
        assert result == sample_fixture.list_saves

    async def test_client_returns_fixture_get_dates(
        self,
        sample_fixture: Fixture,
        mock_client_from_fixture: MockClient,
    ) -> None:
        for filename, expected in sample_fixture.get_dates.items():
            result = await mock_client_from_fixture.get_dates(filename=filename)
            assert result == expected

    async def test_client_returns_fixture_get_budget(
        self,
        sample_fixture: Fixture,
        mock_client_from_fixture: MockClient,
    ) -> None:
        for filename, expected in sample_fixture.get_budget.items():
            result = await mock_client_from_fixture.get_budget(filename=filename)
            assert result == expected
