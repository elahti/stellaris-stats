from __future__ import annotations

import asyncio
import json
import re
import socket
from contextlib import asynccontextmanager
from dataclasses import dataclass
from http import HTTPStatus
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from agent.evals.mock_client import Fixture


@dataclass
class MockGraphQLServer:
    fixture: Fixture
    host: str
    port: int
    _server: asyncio.Server | None = None

    @property
    def url(self) -> str:
        return f"http://{self.host}:{self.port}"

    async def start(self) -> None:
        self._server = await asyncio.start_server(
            self._handle_connection,
            self.host,
            self.port,
        )
        await self._server.start_serving()

    async def stop(self) -> None:
        if self._server:
            self._server.close()
            await self._server.wait_closed()

    async def _handle_connection(
        self,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter,
    ) -> None:
        try:
            request_line = await reader.readline()
            if not request_line:
                return

            request_str = request_line.decode("utf-8").strip()
            method, _, _ = request_str.split(" ", 2)

            headers: dict[str, str] = {}
            while True:
                header_line = await reader.readline()
                if header_line in (b"\r\n", b"\n", b""):
                    break
                header_str = header_line.decode("utf-8").strip()
                if ":" in header_str:
                    key, value = header_str.split(":", 1)
                    headers[key.strip().lower()] = value.strip()

            content_length = int(headers.get("content-length", 0))
            body = b""
            if content_length > 0:
                body = await reader.read(content_length)

            if method == "POST":
                response_body = self._handle_graphql_request(body)
                status = HTTPStatus.OK
            else:
                response_body = json.dumps({"error": "Method not allowed"})
                status = HTTPStatus.METHOD_NOT_ALLOWED

            response = self._build_response(status, response_body)
            writer.write(response.encode("utf-8"))
            await writer.drain()
        finally:
            writer.close()
            await writer.wait_closed()

    def _handle_graphql_request(self, body: bytes) -> str:
        try:
            request_data = json.loads(body.decode("utf-8"))
            query = request_data.get("query", "")
            variables = request_data.get("variables", {})

            response_data = self._execute_query(query, variables)
            return json.dumps(response_data)
        except json.JSONDecodeError:
            return json.dumps({"errors": [{"message": "Invalid JSON"}]})

    def _execute_query(self, query: str, variables: dict[str, Any]) -> dict[str, Any]:
        query_lower = query.lower()

        if "listsaves" in query_lower or (
            "saves" in query_lower and "filename" not in query_lower
        ):
            return {"data": self.fixture.list_saves.model_dump(by_alias=True)}

        if "getdates" in query_lower or (
            "gamestates" in query_lower
            and "budget" not in query_lower
            and "date" in query_lower
        ):
            filename = variables.get("filename", "")
            dates_response = self.fixture.get_dates.get(filename)
            if dates_response:
                return {"data": dates_response.model_dump(by_alias=True)}
            return {"data": {"save": None}}

        if "getbudget" in query_lower or (
            "gamestates" in query_lower and "budget" in query_lower
        ):
            filename = variables.get("filename", "")
            budget_response = self.fixture.get_budget.get(filename)
            if budget_response:
                return {"data": budget_response.model_dump(by_alias=True)}
            return {"data": {"save": None}}

        filename_match = re.search(r"\$filename\s*:\s*String", query)
        if filename_match:
            filename = variables.get("filename", "")
            if "budget" in query_lower:
                budget_response = self.fixture.get_budget.get(filename)
                if budget_response:
                    return {"data": budget_response.model_dump(by_alias=True)}
            else:
                dates_response = self.fixture.get_dates.get(filename)
                if dates_response:
                    return {"data": dates_response.model_dump(by_alias=True)}

        return {"errors": [{"message": f"Unrecognized query: {query[:100]}"}]}

    def _build_response(self, status: HTTPStatus, body: str) -> str:
        headers = [
            f"HTTP/1.1 {status.value} {status.phrase}",
            "Content-Type: application/json",
            f"Content-Length: {len(body)}",
            "Connection: close",
            "",
            body,
        ]
        return "\r\n".join(headers)


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        s.listen(1)
        return s.getsockname()[1]


@asynccontextmanager
async def start_mock_graphql_server(
    fixture: Fixture,
    host: str = "0.0.0.0",
    port: int | None = None,
) -> AsyncIterator[MockGraphQLServer]:
    if port is None:
        port = find_free_port()

    server = MockGraphQLServer(fixture=fixture, host=host, port=port)
    await server.start()
    try:
        yield server
    finally:
        await server.stop()
