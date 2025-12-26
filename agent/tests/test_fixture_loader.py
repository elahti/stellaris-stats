from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from agent.evals.fixture_loader import FIXTURES_DIR, load_fixture


class TestFixturesDir:
    def test_fixtures_dir_exists(self) -> None:
        assert FIXTURES_DIR.exists()

    def test_fixtures_dir_is_directory(self) -> None:
        assert FIXTURES_DIR.is_dir()

    def test_fixtures_dir_points_to_sql_directory(self) -> None:
        assert FIXTURES_DIR.name == "sql"
        assert FIXTURES_DIR.parent.name == "fixtures"


class TestLoadFixture:
    async def test_raises_file_not_found_for_missing_fixture(self) -> None:
        mock_pool: MagicMock = MagicMock()
        with pytest.raises(FileNotFoundError) as exc_info:
            await load_fixture(mock_pool, "nonexistent/fixture.sql")

        assert "nonexistent/fixture.sql" in str(exc_info.value)

    async def test_raises_file_not_found_with_full_path(self) -> None:
        mock_pool: MagicMock = MagicMock()
        with pytest.raises(FileNotFoundError) as exc_info:
            await load_fixture(mock_pool, "does_not_exist.sql")

        expected_path = FIXTURES_DIR / "does_not_exist.sql"
        assert str(expected_path) in str(exc_info.value)

    async def test_constructs_path_from_fixtures_dir(self) -> None:
        mock_pool: MagicMock = MagicMock()
        mock_conn = AsyncMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=None)

        test_fixture = "sudden_drop_detection/trade_drop_only.sql"
        expected_path = FIXTURES_DIR / test_fixture

        if expected_path.exists():
            await load_fixture(mock_pool, test_fixture)
            mock_conn.execute.assert_called_once()
            call_arg = mock_conn.execute.call_args[0][0]
            assert isinstance(call_arg, str)
            assert len(call_arg) > 0
        else:
            pytest.skip("Fixture file not available for path construction test")

    async def test_reads_fixture_file_content(self) -> None:
        mock_pool: MagicMock = MagicMock()
        mock_conn = AsyncMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=None)

        test_sql = "INSERT INTO test VALUES (1);"
        with (
            patch.object(Path, "exists", return_value=True),
            patch.object(Path, "read_text", return_value=test_sql),
        ):
            await load_fixture(mock_pool, "test.sql")

        mock_conn.execute.assert_called_once_with(test_sql)

    async def test_executes_sql_within_connection_context(self) -> None:
        mock_pool: MagicMock = MagicMock()
        mock_conn = AsyncMock()
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_context.__aexit__ = AsyncMock(return_value=None)
        mock_pool.acquire.return_value = mock_context

        with (
            patch.object(Path, "exists", return_value=True),
            patch.object(Path, "read_text", return_value="SELECT 1;"),
        ):
            await load_fixture(mock_pool, "test.sql")

        mock_pool.acquire.assert_called_once()
        mock_context.__aenter__.assert_called_once()
        mock_context.__aexit__.assert_called_once()
