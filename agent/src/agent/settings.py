from __future__ import annotations

import os

from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    stellaris_stats_anthropic_api_key: str | None = None

    @model_validator(mode="after")
    def set_anthropic_api_key(self) -> Settings:
        if self.stellaris_stats_anthropic_api_key:
            os.environ["ANTHROPIC_API_KEY"] = self.stellaris_stats_anthropic_api_key
        return self

    def has_api_key(self) -> bool:
        return self.stellaris_stats_anthropic_api_key is not None
