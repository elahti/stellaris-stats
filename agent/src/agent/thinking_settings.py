from typing import Literal

from pydantic_ai.models.anthropic import AnthropicModelSettings
from pydantic_ai.models.openai import OpenAIResponsesModelSettings
from pydantic_ai.settings import ModelSettings

ThinkingLevel = Literal["off", "minimal", "low", "medium", "high", "max"]

THINKING_LEVELS: list[ThinkingLevel] = [
    "off",
    "minimal",
    "low",
    "medium",
    "high",
    "max",
]

ANTHROPIC_BUDGET_TOKENS: dict[ThinkingLevel, int] = {
    "minimal": 1024,
    "low": 4096,
    "medium": 16384,
    "high": 32768,
    "max": 65536,
}

OPENAI_REASONING_EFFORT: dict[ThinkingLevel, str] = {
    "minimal": "minimal",
    "low": "low",
    "medium": "medium",
    "high": "high",
    "max": "xhigh",
}


def get_model_settings(
    model_name: str,
    thinking_level: ThinkingLevel,
) -> ModelSettings | None:
    if thinking_level == "off":
        return None
    if model_name.startswith("anthropic:"):
        budget_tokens = ANTHROPIC_BUDGET_TOKENS[thinking_level]
        return AnthropicModelSettings(
            anthropic_thinking={"type": "enabled", "budget_tokens": budget_tokens},
        )
    elif model_name.startswith("openai-responses:"):
        reasoning_effort = OPENAI_REASONING_EFFORT[thinking_level]
        return OpenAIResponsesModelSettings(
            openai_reasoning_effort=reasoning_effort,  # type: ignore[arg-type]
        )
    else:
        raise ValueError(
            f"Unsupported model provider for thinking settings: {model_name}. "
            + "Expected 'anthropic:' or 'openai-responses:' prefix.",
        )
