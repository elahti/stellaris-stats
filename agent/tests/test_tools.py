from datetime import datetime
from typing import cast
from unittest.mock import MagicMock

from agent.budget_agent.tools import (
    get_gamestates_for_dates,
    select_latest_dates,
)
from agent.graphql_client import (
    GetBudget,
    GetBudgetSave,
    GetBudgetSaveGamestates,
)


class TestSelectLatestDates:
    def test_returns_last_n_dates_when_list_is_longer(self) -> None:
        dates = ["2200-01-01", "2200-02-01", "2200-03-01", "2200-04-01", "2200-05-01"]
        result = select_latest_dates(dates, count=3)
        assert result == ["2200-03-01", "2200-04-01", "2200-05-01"]

    def test_returns_all_dates_when_list_is_shorter(self) -> None:
        dates = ["2200-01-01", "2200-02-01"]
        result = select_latest_dates(dates, count=4)
        assert result == ["2200-01-01", "2200-02-01"]

    def test_returns_exact_dates_when_count_equals_length(self) -> None:
        dates = ["2200-01-01", "2200-02-01", "2200-03-01"]
        result = select_latest_dates(dates, count=3)
        assert result == ["2200-01-01", "2200-02-01", "2200-03-01"]

    def test_returns_empty_list_when_input_is_empty(self) -> None:
        result = select_latest_dates([], count=5)
        assert result == []

    def test_uses_default_count_of_six(self) -> None:
        dates = [f"2200-{i:02d}-01" for i in range(1, 10)]
        result = select_latest_dates(dates)
        assert len(result) == 6
        assert result == dates[-6:]

    def test_single_date_with_count_one(self) -> None:
        dates = ["2200-01-01"]
        result = select_latest_dates(dates, count=1)
        assert result == ["2200-01-01"]

    def test_preserves_date_order(self) -> None:
        dates = ["a", "b", "c", "d", "e"]
        result = select_latest_dates(dates, count=3)
        assert result == ["c", "d", "e"]


def _create_mock_gamestate(date: datetime) -> GetBudgetSaveGamestates:
    mock = MagicMock(spec=GetBudgetSaveGamestates)
    mock.date = date
    return cast(GetBudgetSaveGamestates, mock)


class TestGetGamestatesForDates:
    def test_returns_none_when_save_is_none(self) -> None:
        budget_data = GetBudget(save=None)
        result = get_gamestates_for_dates(budget_data, ["2200-01-01"])
        assert result is None

    def test_returns_none_when_date_not_found(self) -> None:
        gs = _create_mock_gamestate(datetime(2200, 1, 1))
        budget_data = GetBudget.model_construct(
            save=GetBudgetSave.model_construct(gamestates=[gs]),
        )
        result = get_gamestates_for_dates(budget_data, ["2200-02-01 00:00:00"])
        assert result is None

    def test_returns_gamestates_in_date_order(self) -> None:
        gs1 = _create_mock_gamestate(datetime(2200, 1, 1))
        gs2 = _create_mock_gamestate(datetime(2200, 2, 1))
        gs3 = _create_mock_gamestate(datetime(2200, 3, 1))
        budget_data = GetBudget.model_construct(
            save=GetBudgetSave.model_construct(gamestates=[gs3, gs1, gs2]),
        )
        result = get_gamestates_for_dates(
            budget_data,
            ["2200-01-01 00:00:00", "2200-02-01 00:00:00", "2200-03-01 00:00:00"],
        )
        assert result is not None
        assert len(result) == 3
        assert result[0].date == datetime(2200, 1, 1)
        assert result[1].date == datetime(2200, 2, 1)
        assert result[2].date == datetime(2200, 3, 1)

    def test_returns_single_gamestate_for_single_date(self) -> None:
        gs = _create_mock_gamestate(datetime(2200, 5, 15))
        budget_data = GetBudget.model_construct(
            save=GetBudgetSave.model_construct(gamestates=[gs]),
        )
        result = get_gamestates_for_dates(budget_data, ["2200-05-15 00:00:00"])
        assert result is not None
        assert len(result) == 1
        assert result[0].date == datetime(2200, 5, 15)

    def test_returns_none_when_one_date_missing(self) -> None:
        gs1 = _create_mock_gamestate(datetime(2200, 1, 1))
        gs2 = _create_mock_gamestate(datetime(2200, 3, 1))
        budget_data = GetBudget.model_construct(
            save=GetBudgetSave.model_construct(gamestates=[gs1, gs2]),
        )
        result = get_gamestates_for_dates(
            budget_data,
            ["2200-01-01 00:00:00", "2200-02-01 00:00:00", "2200-03-01 00:00:00"],
        )
        assert result is None

    def test_empty_dates_list_returns_empty_gamestates(self) -> None:
        gs = _create_mock_gamestate(datetime(2200, 1, 1))
        budget_data = GetBudget.model_construct(
            save=GetBudgetSave.model_construct(gamestates=[gs]),
        )
        result = get_gamestates_for_dates(budget_data, [])
        assert result is not None
        assert result == []
