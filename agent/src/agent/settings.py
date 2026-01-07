from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING

import httpx
from pydantic_ai.retries import AsyncTenacityTransport, RetryConfig
from pydantic_settings import BaseSettings
from tenacity import retry_if_exception_type, stop_after_attempt, wait_exponential

if TYPE_CHECKING:
    from agent.graphql_client import Client

GRAPHQL_TIMEOUT_SECONDS = 180.0
MCP_TIMEOUT_SECONDS = 180.0


def create_resilient_http_client(
    timeout: float = GRAPHQL_TIMEOUT_SECONDS,
) -> httpx.AsyncClient:
    """Create an HTTP client with retry logic for transient failures."""
    transport = AsyncTenacityTransport(
        config=RetryConfig(
            retry=retry_if_exception_type(
                (httpx.TimeoutException, httpx.ConnectError, httpx.ReadError),
            ),
            wait=wait_exponential(multiplier=1, max=10),
            stop=stop_after_attempt(3),
            reraise=True,
        ),
    )
    return httpx.AsyncClient(transport=transport, timeout=httpx.Timeout(timeout))


class Settings(BaseSettings):
    """Configuration settings loaded from environment variables."""

    anthropic_api_key: str
    openai_api_key: str
    logfire_token: str
    stellaris_stats_graphql_server_host: str
    stellaris_stats_graphql_server_port: int
    stellaris_stats_python_sandbox_url: str

    # Database config (production or evals, injected via dotenvx)
    stellaris_stats_db_host: str
    stellaris_stats_db_port: int
    stellaris_stats_db_name: str
    stellaris_stats_db_user: str
    stellaris_stats_db_password: str

    # Eval GraphQL server host (for sandbox to reach the test server)
    # Optional: only needed when running evals
    stellaris_stats_eval_graphql_server_host: str = ""

    @property
    def graphql_url(self) -> str:
        """Build the GraphQL server URL from host and port settings."""
        return f"http://{self.stellaris_stats_graphql_server_host}:{self.stellaris_stats_graphql_server_port}"

    @property
    def sandbox_url(self) -> str:
        """Get the Python sandbox MCP server URL."""
        return self.stellaris_stats_python_sandbox_url

    def create_graphql_client(self) -> Client:
        """Create a GraphQL client with retry logic and timeout configuration."""
        from agent.graphql_client import Client

        http_client = create_resilient_http_client(GRAPHQL_TIMEOUT_SECONDS)
        return Client(url=self.graphql_url, http_client=http_client)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Create Settings instance populated from environment variables."""
    return Settings()  # type: ignore[call-arg]
