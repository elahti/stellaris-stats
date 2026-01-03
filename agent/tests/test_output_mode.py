from pydantic import BaseModel
from pydantic_ai import NativeOutput, ToolOutput

from agent.constants import wrap_output_type
from agent.thinking_settings import is_thinking_enabled


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
