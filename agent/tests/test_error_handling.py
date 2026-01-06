from datetime import UTC, datetime
from typing import Any
from unittest.mock import MagicMock

import pytest

from agent.graphql_client import (
    GetBudget,
    GetDates,
    GetDatesSave,
    GetDatesSaveGamestates,
    ListSaves,
)
from agent.native_budget.agent import (
    sum_resources_for_snapshot,
)
from agent.native_budget.models import BudgetSnapshot
from agent.native_budget.tools import (
    get_available_dates,
    get_gamestates_for_dates,
    list_saves,
    select_latest_dates,
)

from .conftest import MockClient


class TestEmptyGraphQLResponses:
    @pytest.mark.asyncio
    async def test_list_saves_handles_empty_response(self) -> None:
        mock_client = MockClient(saves=[])
        result = await list_saves(mock_client)
        assert result == []

    @pytest.mark.asyncio
    async def test_get_dates_handles_missing_save(self) -> None:
        mock_client = MockClient(
            dates={
                "other.sav": GetDates(save=None),
            },
        )
        result = await get_available_dates(mock_client, "nonexistent.sav")
        assert result == []

    @pytest.mark.asyncio
    async def test_get_dates_handles_empty_gamestates(self) -> None:
        mock_client = MockClient(
            dates={
                "empty.sav": GetDates(
                    save=GetDatesSave(gamestates=[]),
                ),
            },
        )
        result = await get_available_dates(mock_client, "empty.sav")
        assert result == []

    def test_get_gamestates_handles_none_save(self) -> None:
        budget_data = GetBudget(save=None)
        result = get_gamestates_for_dates(budget_data, ["2200-01-01"])
        assert result is None


class TestMalformedDateStrings:
    def test_select_latest_dates_handles_unsortable_dates(self) -> None:
        dates = ["invalid", "also-invalid", "not-a-date"]
        result = select_latest_dates(dates, count=2)
        assert len(result) == 2

    def test_select_latest_dates_handles_mixed_formats(self) -> None:
        dates = ["2200-01-01", "2200.02.01", "2200/03/01"]
        result = select_latest_dates(dates, count=2)
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_get_dates_with_various_datetime_formats(self) -> None:
        mock_client = MockClient(
            dates={
                "test.sav": GetDates(
                    save=GetDatesSave(
                        gamestates=[
                            GetDatesSaveGamestates(
                                date=datetime(2200, 1, 1, tzinfo=UTC),
                            ),
                        ],
                    ),
                ),
            },
        )
        result = await get_available_dates(mock_client, "test.sav")
        assert len(result) == 1


class TestMissingBudgetData:
    def test_sum_resources_handles_empty_budget(self) -> None:
        snapshot = BudgetSnapshot(date="2200-01-01", budget={})
        result = sum_resources_for_snapshot(snapshot)
        for value in result.values():
            assert value == 0.0

    def test_sum_resources_handles_none_categories(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={
                "countryBase": None,
                "ships": None,
            },
        )
        result = sum_resources_for_snapshot(snapshot)
        for value in result.values():
            assert value == 0.0

    def test_sum_resources_handles_partial_resources(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={
                "countryBase": {"energy": 100.0},
            },
        )
        result = sum_resources_for_snapshot(snapshot)
        assert result["energy"] == 100.0
        assert result["minerals"] == 0.0
        assert result["alloys"] == 0.0

    def test_sum_resources_handles_all_none_values(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={
                "countryBase": {"energy": None, "minerals": None},
            },
        )
        result = sum_resources_for_snapshot(snapshot)
        assert result["energy"] == 0.0
        assert result["minerals"] == 0.0


class TestAPITimeouts:
    @pytest.mark.asyncio
    async def test_list_saves_timeout_behavior(self) -> None:
        async def slow_list_saves(**kwargs: object) -> ListSaves:
            import asyncio

            await asyncio.sleep(0.01)
            return ListSaves(saves=[])

        mock_client = MagicMock()
        mock_client.list_saves = slow_list_saves

        result = await list_saves(mock_client)
        assert result == []

    @pytest.mark.asyncio
    async def test_get_dates_timeout_behavior(self) -> None:
        async def slow_get_dates(filename: str, **kwargs: object) -> GetDates:
            import asyncio

            await asyncio.sleep(0.01)
            return GetDates(save=None)

        mock_client = MagicMock()
        mock_client.get_dates = slow_get_dates

        result = await get_available_dates(mock_client, "test.sav")
        assert result == []


class TestEdgeCases:
    def test_select_latest_dates_with_single_date(self) -> None:
        dates = ["2200-01-01"]
        result = select_latest_dates(dates, count=6)
        assert result == ["2200-01-01"]

    def test_select_latest_dates_with_count_zero(self) -> None:
        dates = ["2200-01-01", "2200-02-01"]
        result = select_latest_dates(dates, count=0)
        # dates[-0:] returns entire list in Python slice semantics
        assert result == dates

    def test_get_gamestates_empty_dates_list(self) -> None:
        mock_budget = _create_mock_budget_data([])
        result = get_gamestates_for_dates(mock_budget, [])
        assert result == []

    def test_sum_resources_with_negative_values(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={
                "ships": {"energy": -50.0, "alloys": -25.0},
            },
        )
        result = sum_resources_for_snapshot(snapshot)
        assert result["energy"] == -50.0
        assert result["alloys"] == -25.0

    def test_sum_resources_with_very_large_values(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={
                "megastructures": {"energy": 1e10, "alloys": 1e10},
            },
        )
        result = sum_resources_for_snapshot(snapshot)
        assert result["energy"] == 1e10
        assert result["alloys"] == 1e10

    def test_sum_resources_with_float_precision(self) -> None:
        snapshot = BudgetSnapshot(
            date="2200-01-01",
            budget={
                "countryBase": {"energy": 0.1},
                "ships": {"energy": 0.2},
            },
        )
        result = sum_resources_for_snapshot(snapshot)
        assert abs(result["energy"] - 0.3) < 1e-10


def _create_mock_budget_data(gamestates: list[Any]) -> Any:
    mock = MagicMock(spec=GetBudget)
    mock.save = MagicMock()
    mock.save.gamestates = gamestates
    return mock
