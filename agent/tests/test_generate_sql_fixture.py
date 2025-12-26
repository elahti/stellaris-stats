from datetime import datetime
from unittest.mock import MagicMock

import asyncpg

from scripts.generate_sql_fixture import (
    BUDGET_ENTRY_COLUMNS,
    generate_sql_statements,
    sql_num,
    sql_str,
)


class TestSqlStr:
    def test_returns_null_for_none(self) -> None:
        assert sql_str(None) == "NULL"

    def test_wraps_string_in_single_quotes(self) -> None:
        assert sql_str("hello") == "'hello'"

    def test_escapes_single_quotes(self) -> None:
        assert sql_str("O'Brien") == "'O''Brien'"

    def test_escapes_multiple_single_quotes(self) -> None:
        assert sql_str("It's a 'test'") == "'It''s a ''test'''"

    def test_handles_empty_string(self) -> None:
        assert sql_str("") == "''"

    def test_handles_datetime_object(self) -> None:
        dt = datetime(2308, 7, 1, 12, 30, 45)
        result = sql_str(dt)
        assert result == "'2308-07-01T12:30:45'"

    def test_handles_datetime_date_only(self) -> None:
        dt = datetime(2200, 1, 1)
        result = sql_str(dt)
        assert result == "'2200-01-01T00:00:00'"

    def test_handles_unicode_characters(self) -> None:
        assert sql_str("日本語") == "'日本語'"

    def test_handles_special_characters(self) -> None:
        assert sql_str("test\nwith\ttabs") == "'test\nwith\ttabs'"


class TestSqlNum:
    def test_returns_null_for_none(self) -> None:
        assert sql_num(None) == "NULL"

    def test_handles_positive_integer(self) -> None:
        assert sql_num(42) == "42"

    def test_handles_zero(self) -> None:
        assert sql_num(0) == "0"

    def test_handles_negative_integer(self) -> None:
        assert sql_num(-100) == "-100"

    def test_handles_positive_float(self) -> None:
        assert sql_num(3.14159) == "3.14159"

    def test_handles_negative_float(self) -> None:
        assert sql_num(-99.5) == "-99.5"

    def test_handles_very_small_float(self) -> None:
        result = sql_num(0.0001)
        assert result == "0.0001"

    def test_handles_large_number(self) -> None:
        assert sql_num(1000000000) == "1000000000"


class TestGenerateSqlStatements:
    def _create_mock_record(self, data: dict[str, object]) -> asyncpg.Record:
        mock: MagicMock = MagicMock(spec=asyncpg.Record)

        def get_item(_: object, key: str) -> object:
            return data[key]

        mock.__getitem__ = get_item
        return mock

    def test_includes_header_comment_with_description(self) -> None:
        save = self._create_mock_record({"filename": "test.sav", "name": "Test Save"})
        result = generate_sql_statements(save, [], [], "Test fixture description")
        assert "-- Test fixture description" in result

    def test_includes_generated_timestamp(self) -> None:
        save = self._create_mock_record({"filename": "test.sav", "name": "Test Save"})
        result = generate_sql_statements(save, [], [], "")
        assert "-- Generated:" in result

    def test_includes_gamestate_count(self) -> None:
        save = self._create_mock_record({"filename": "test.sav", "name": "Test Save"})
        gamestates = [
            self._create_mock_record({"gamestate_id": 1, "date": datetime(2200, 1, 1)}),
            self._create_mock_record({"gamestate_id": 2, "date": datetime(2200, 2, 1)}),
        ]
        result = generate_sql_statements(save, gamestates, [], "")
        assert "-- Gamestates: 2" in result

    def test_includes_budget_entry_count(self) -> None:
        save = self._create_mock_record({"filename": "test.sav", "name": "Test Save"})
        budget_data = [
            self._create_mock_record({
                "gamestate_id": 1,
                "category_type": "income",
                "category_name": "trade",
                **dict.fromkeys(BUDGET_ENTRY_COLUMNS, 0.0),
            }),
        ]
        gamestates = [
            self._create_mock_record({"gamestate_id": 1, "date": datetime(2200, 1, 1)}),
        ]
        result = generate_sql_statements(save, gamestates, budget_data, "")
        assert "-- Budget entries: 1" in result

    def test_generates_save_insert(self) -> None:
        save = self._create_mock_record({
            "filename": "commonwealth_123",
            "name": "Commonwealth",
        })
        result = generate_sql_statements(save, [], [], "")
        assert (
            "INSERT INTO save (filename, name) VALUES ('commonwealth_123', 'Commonwealth');"
            in result
        )

    def test_escapes_save_name_with_quotes(self) -> None:
        save = self._create_mock_record({
            "filename": "test.sav",
            "name": "Player's Empire",
        })
        result = generate_sql_statements(save, [], [], "")
        assert "'Player''s Empire'" in result

    def test_generates_gamestate_inserts(self) -> None:
        save = self._create_mock_record({"filename": "test.sav", "name": "Test"})
        gamestates = [
            self._create_mock_record({"gamestate_id": 1, "date": datetime(2200, 1, 1)}),
        ]
        result = generate_sql_statements(save, gamestates, [], "")
        assert "INSERT INTO gamestate" in result
        assert "2200-01-01" in result

    def test_generates_budget_entry_inserts(self) -> None:
        save = self._create_mock_record({"filename": "test.sav", "name": "Test"})
        gamestates = [
            self._create_mock_record({"gamestate_id": 1, "date": datetime(2200, 1, 1)}),
        ]
        budget_entry_values: dict[str, float] = dict.fromkeys(BUDGET_ENTRY_COLUMNS, 0.0)
        budget_entry_values["energy"] = 100.5
        budget_data = [
            self._create_mock_record({
                "gamestate_id": 1,
                "category_type": "income",
                "category_name": "trade",
                **budget_entry_values,
            }),
        ]
        result = generate_sql_statements(save, gamestates, budget_data, "")
        assert "INSERT INTO budget_entry" in result
        assert "100.5" in result

    def test_generates_budget_category_inserts(self) -> None:
        save = self._create_mock_record({"filename": "test.sav", "name": "Test"})
        gamestates = [
            self._create_mock_record({"gamestate_id": 1, "date": datetime(2200, 1, 1)}),
        ]
        budget_data = [
            self._create_mock_record({
                "gamestate_id": 1,
                "category_type": "income",
                "category_name": "trade_value",
                **dict.fromkeys(BUDGET_ENTRY_COLUMNS, 0.0),
            }),
        ]
        result = generate_sql_statements(save, gamestates, budget_data, "")
        assert "INSERT INTO budget_category" in result
        assert "'income'" in result
        assert "'trade_value'" in result

    def test_handles_null_budget_values(self) -> None:
        save = self._create_mock_record({"filename": "test.sav", "name": "Test"})
        gamestates = [
            self._create_mock_record({"gamestate_id": 1, "date": datetime(2200, 1, 1)}),
        ]
        budget_entry_values: dict[str, None] = dict.fromkeys(BUDGET_ENTRY_COLUMNS)
        budget_data = [
            self._create_mock_record({
                "gamestate_id": 1,
                "category_type": "income",
                "category_name": "trade",
                **budget_entry_values,
            }),
        ]
        result = generate_sql_statements(save, gamestates, budget_data, "")
        assert "NULL" in result

    def test_uses_all_twenty_budget_columns(self) -> None:
        assert len(BUDGET_ENTRY_COLUMNS) == 20
        expected_columns = [
            "energy",
            "minerals",
            "food",
            "alloys",
            "consumer_goods",
            "trade",
            "unity",
            "influence",
            "physics_research",
            "engineering_research",
            "society_research",
            "exotic_gases",
            "rare_crystals",
            "volatile_motes",
            "astral_threads",
            "minor_artifacts",
            "nanites",
            "sr_zro",
            "sr_dark_matter",
            "sr_living_metal",
        ]
        assert expected_columns == BUDGET_ENTRY_COLUMNS
