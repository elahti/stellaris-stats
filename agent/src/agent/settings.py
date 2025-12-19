from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str | None = None
    logfire_token: str | None = None

    def has_api_key(self) -> bool:
        return self.anthropic_api_key is not None
