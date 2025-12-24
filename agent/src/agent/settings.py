from __future__ import annotations

from typing import TYPE_CHECKING

import httpx
from pydantic_settings import BaseSettings

if TYPE_CHECKING:
    from agent.graphql_client import Client

GRAPHQL_TIMEOUT_SECONDS = 180.0


class Settings(BaseSettings):
    """Configuration settings loaded from environment variables."""

    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    logfire_token: str | None = None
    stellaris_stats_graphql_server_host: str = "devcontainer"
    stellaris_stats_graphql_server_port: int = 4000
    stellaris_stats_python_sandbox_url: str | None = None
    stellaris_stats_eval_mock_graphql_server_host: str = "localhost"

    @property
    def graphql_url(self) -> str:
        """Build the GraphQL server URL from host and port settings."""
        return f"http://{self.stellaris_stats_graphql_server_host}:{self.stellaris_stats_graphql_server_port}"

    @property
    def sandbox_url(self) -> str:
        """Get the Python sandbox MCP server URL."""
        if self.stellaris_stats_python_sandbox_url is None:
            raise ValueError(
                "STELLARIS_STATS_PYTHON_SANDBOX_URL environment variable not set",
            )
        return self.stellaris_stats_python_sandbox_url

    @property
    def eval_mock_graphql_host(self) -> str:
        """Get the hostname for mock GraphQL server during evals."""
        return self.stellaris_stats_eval_mock_graphql_server_host

    def create_graphql_client(self) -> Client:
        """Create a GraphQL client with appropriate timeout configuration."""
        from agent.graphql_client import Client

        http_client = httpx.AsyncClient(timeout=httpx.Timeout(GRAPHQL_TIMEOUT_SECONDS))
        return Client(url=self.graphql_url, http_client=http_client)
