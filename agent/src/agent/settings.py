from __future__ import annotations

from pydantic_settings import BaseSettings


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
