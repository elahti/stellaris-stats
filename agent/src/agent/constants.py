from collections.abc import Callable

from pydantic_ai.models import Model
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.models.openai import OpenAIResponsesModel


def create_claude_haiku() -> Model:
    return AnthropicModel("claude-haiku-4-5-20251001")


def create_claude_sonnet() -> Model:
    return AnthropicModel("claude-sonnet-4-5-20250929")


def create_gpt_4_1() -> Model:
    return OpenAIResponsesModel("gpt-4.1-2025-04-14")


def create_gpt_5_2() -> Model:
    return OpenAIResponsesModel("gpt-5.2-2025-12-11")


def create_gpt_5_mini() -> Model:
    return OpenAIResponsesModel("gpt-5-mini-2025-08-07")


def create_gpt_5_nano() -> Model:
    return OpenAIResponsesModel("gpt-5-nano-2025-08-07")


def create_gpt_5_1_codex_max() -> Model:
    return OpenAIResponsesModel("gpt-5.1-codex-max")


AVAILABLE_MODELS: dict[str, Callable[[], Model]] = {
    "anthropic:claude-haiku-4-5-20251001": create_claude_haiku,
    "anthropic:claude-sonnet-4-5-20250929": create_claude_sonnet,
    "openai-responses:gpt-4.1-2025-04-14": create_gpt_4_1,
    "openai-responses:gpt-5.2-2025-12-11": create_gpt_5_2,
    "openai-responses:gpt-5-mini-2025-08-07": create_gpt_5_mini,
    "openai-responses:gpt-5-nano-2025-08-07": create_gpt_5_nano,
    "openai-responses:gpt-5.1-codex-max": create_gpt_5_1_codex_max,
}

DEFAULT_MODEL = "openai-responses:gpt-5.2-2025-12-11"


def get_model(name: str) -> Model:
    return AVAILABLE_MODELS[name]()


def get_model_names() -> list[str]:
    return list(AVAILABLE_MODELS.keys())
