from typing import get_args

from pydantic import BaseModel
from pydantic_ai import NativeOutput, ToolOutput

from agent.constants import wrap_output_type
from agent.thinking_settings import (
    ANTHROPIC_BUDGET_TOKENS,
    ANTHROPIC_MAX_TOKENS,
    ThinkingLevel,
    get_model_settings,
    is_thinking_enabled,
)


class DummyOutput(BaseModel):
    value: str


class TestWrapOutputType:
    def test_returns_tool_output_by_default(self) -> None:
        result = wrap_output_type(DummyOutput, "openai-responses:gpt-5.2")
        assert isinstance(result, ToolOutput)

    def test_returns_tool_output_for_anthropic_without_thinking(self) -> None:
        result = wrap_output_type(
            DummyOutput,
            "anthropic:claude-sonnet-4-5",
            thinking_enabled=False,
        )
        assert isinstance(result, ToolOutput)

    def test_returns_native_output_for_anthropic_with_thinking(self) -> None:
        result = wrap_output_type(
            DummyOutput,
            "anthropic:claude-sonnet-4-5",
            thinking_enabled=True,
        )
        assert isinstance(result, NativeOutput)

    def test_returns_tool_output_for_openai_with_thinking(self) -> None:
        result = wrap_output_type(
            DummyOutput,
            "openai-responses:gpt-5.2",
            thinking_enabled=True,
        )
        assert isinstance(result, ToolOutput)

    def test_returns_tool_output_for_openai_without_thinking(self) -> None:
        result = wrap_output_type(
            DummyOutput,
            "openai-responses:gpt-5.2",
            thinking_enabled=False,
        )
        assert isinstance(result, ToolOutput)


class TestIsThinkingEnabled:
    def test_returns_false_when_thinking_off(self) -> None:
        assert is_thinking_enabled("anthropic:claude-sonnet-4-5", "off") is False

    def test_returns_false_for_openai_with_thinking(self) -> None:
        assert is_thinking_enabled("openai-responses:gpt-5.2", "high") is False

    def test_returns_true_for_anthropic_with_thinking(self) -> None:
        assert is_thinking_enabled("anthropic:claude-sonnet-4-5", "high") is True

    def test_returns_true_for_anthropic_with_minimal_thinking(self) -> None:
        assert is_thinking_enabled("anthropic:claude-haiku-4-5", "minimal") is True

    def test_returns_true_for_anthropic_with_max_thinking(self) -> None:
        assert is_thinking_enabled("anthropic:claude-sonnet-4-5", "max") is True

    def test_returns_false_for_openai_with_off(self) -> None:
        assert is_thinking_enabled("openai-responses:gpt-5.2", "off") is False


class TestGetModelSettings:
    def test_returns_none_when_thinking_off(self) -> None:
        result = get_model_settings("anthropic:claude-sonnet-4-5", "off")
        assert result is None

    def test_returns_anthropic_settings_for_anthropic_model(self) -> None:
        result = get_model_settings("anthropic:claude-sonnet-4-5", "high")
        assert result is not None
        assert "anthropic_thinking" in result

    def test_returns_openai_settings_for_openai_model(self) -> None:
        result = get_model_settings("openai-responses:gpt-5.2", "high")
        assert result is not None
        assert "openai_reasoning_effort" in result

    def test_anthropic_settings_include_max_tokens(self) -> None:
        result = get_model_settings("anthropic:claude-sonnet-4-5", "medium")
        assert result is not None
        assert result["max_tokens"] == ANTHROPIC_MAX_TOKENS["medium"]  # pyright: ignore[reportTypedDictNotRequiredAccess]

    def test_anthropic_settings_include_thinking_config(self) -> None:
        result = get_model_settings("anthropic:claude-sonnet-4-5", "low")
        assert result is not None
        thinking: dict[str, object] = result["anthropic_thinking"]  # pyright: ignore[reportGeneralTypeIssues,reportUnknownVariableType]
        assert thinking["type"] == "enabled"
        assert thinking["budget_tokens"] == ANTHROPIC_BUDGET_TOKENS["low"]

    def test_max_tokens_greater_than_budget_tokens_for_all_levels(self) -> None:
        levels: list[ThinkingLevel] = list(get_args(ThinkingLevel))
        for level in levels:
            if level == "off":
                continue
            assert ANTHROPIC_MAX_TOKENS[level] > ANTHROPIC_BUDGET_TOKENS[level], (
                f"max_tokens must be > budget_tokens for level {level}"
            )
