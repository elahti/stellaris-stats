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

    @property
    def graphql_url(self) -> str:
        """Build the GraphQL server URL from host and port settings."""
        return f"http://{self.stellaris_stats_graphql_server_host}:{self.stellaris_stats_graphql_server_port}"

    def create_graphql_client(self) -> Client:
        """Create a GraphQL client with appropriate timeout configuration."""
        from agent.graphql_client import Client

        http_client = httpx.AsyncClient(timeout=httpx.Timeout(GRAPHQL_TIMEOUT_SECONDS))
        return Client(url=self.graphql_url, http_client=http_client)
