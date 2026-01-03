from pydantic import BaseModel
from pydantic_ai import ToolOutput

from agent.constants import wrap_output_type


class DummyOutput(BaseModel):
    value: str


class TestWrapOutputType:
    def test_returns_tool_output(self) -> None:
        result = wrap_output_type(DummyOutput)
        assert isinstance(result, ToolOutput)
