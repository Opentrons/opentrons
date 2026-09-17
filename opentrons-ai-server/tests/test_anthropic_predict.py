"""Unit tests for AnthropicPredict's tool-call handling loop.

Regression tests for AUTH-3347: on Sonnet 5, a single tool-call round trip is no longer a
safe assumption. The model may issue more than one tool_use block in a single turn, or chain
tool calls across multiple turns (e.g. get_relevant_api_docs then simulate_protocol) before
returning its final answer. `AnthropicPredict._handle_response` must loop through all of that
and only return once the model produces a final text-only response.
"""

import asyncio
from typing import Any, Dict, List, cast
from unittest.mock import AsyncMock

import pytest
from anthropic.types import Message, MessageParam, TextBlock, ToolUseBlock, Usage
from api.domain.anthropic_predict import TOOL_ROUNDS_EXCEEDED_USER_MESSAGE, AnthropicPredict
from api.settings import get_settings


def _usage() -> Usage:
    return Usage(input_tokens=1, output_tokens=1)


def _message(content: List[Any]) -> Message:
    return Message(
        id="msg_test",
        content=content,
        model="claude-sonnet-5",
        role="assistant",
        stop_reason="tool_use",
        type="message",
        usage=_usage(),
    )


def _text_message(text: str) -> Message:
    return _message([TextBlock(type="text", text=text, citations=None)])


def _tool_use_message(*tool_uses: ToolUseBlock) -> Message:
    return _message(list(tool_uses))


@pytest.fixture()
def predict() -> AnthropicPredict:
    return AnthropicPredict(get_settings())


@pytest.mark.unit
def test_handle_response_returns_text_when_no_tool_use(predict: AnthropicPredict) -> None:
    response = _text_message("Here is your protocol.")

    result = asyncio.run(predict._handle_response(response, [], "user-1", "create"))

    assert result == "Here is your protocol."


@pytest.mark.unit
def test_handle_response_executes_every_tool_use_block_in_a_single_turn(predict: AnthropicPredict) -> None:
    """A single assistant turn can contain more than one tool_use block; every one of them
    must get a matching tool_result, or the next Anthropic API call fails outright."""
    tool_use_1 = ToolUseBlock(id="tool_1", name="get_relevant_api_docs", input={"query": "modules"}, type="tool_use")
    tool_use_2 = ToolUseBlock(id="tool_2", name="get_relevant_api_docs", input={"query": "pipettes"}, type="tool_use")
    first_response = _tool_use_message(tool_use_1, tool_use_2)
    final_response = _text_message("Final protocol")

    predict.handle_tool_use = AsyncMock(return_value="tool result content")  # type: ignore[method-assign]
    predict._process_message = AsyncMock(return_value=final_response)  # type: ignore[method-assign]

    messages: List[MessageParam] = []
    result = asyncio.run(predict._handle_response(first_response, messages, "user-1", "create"))

    assert result == "Final protocol"
    assert predict.handle_tool_use.await_count == 2

    tool_result_message = messages[-1]
    assert tool_result_message["role"] == "user"
    tool_results = cast(List[Dict[str, Any]], tool_result_message["content"])
    tool_result_ids = {block["tool_use_id"] for block in tool_results}
    assert tool_result_ids == {"tool_1", "tool_2"}


@pytest.mark.unit
def test_handle_response_follows_chained_tool_calls_across_multiple_rounds(predict: AnthropicPredict) -> None:
    """Sonnet 5 may call a tool, inspect the result, and then call a second tool before
    answering. The loop must keep going instead of returning the first follow-up verbatim
    (which previously either dropped the protocol or returned None)."""
    first_tool_use = ToolUseBlock(id="tool_1", name="get_relevant_api_docs", input={"query": "modules"}, type="tool_use")
    second_tool_use = ToolUseBlock(id="tool_2", name="simulate_protocol", input={"protocol": "..."}, type="tool_use")
    first_response = _tool_use_message(first_tool_use)
    second_response = _tool_use_message(second_tool_use)
    final_response = _text_message("Simulated protocol succeeded.")

    predict.handle_tool_use = AsyncMock(return_value="ok")  # type: ignore[method-assign]
    predict._process_message = AsyncMock(side_effect=[second_response, final_response])  # type: ignore[method-assign]

    result = asyncio.run(predict._handle_response(first_response, [], "user-1", "create"))

    assert result == "Simulated protocol succeeded."
    assert predict._process_message.await_count == 2
    assert predict.handle_tool_use.await_count == 2


@pytest.mark.unit
def test_handle_response_gives_up_after_max_tool_rounds(predict: AnthropicPredict) -> None:
    """If the model never stops calling tools, return a specific user message instead of looping forever."""
    tool_use = ToolUseBlock(id="tool_1", name="get_relevant_api_docs", input={"query": "x"}, type="tool_use")
    always_tool_use = _tool_use_message(tool_use)

    predict.handle_tool_use = AsyncMock(return_value="ok")  # type: ignore[method-assign]
    predict._process_message = AsyncMock(return_value=always_tool_use)  # type: ignore[method-assign]

    result = asyncio.run(predict._handle_response(always_tool_use, [], "user-1", "create"))

    assert result == TOOL_ROUNDS_EXCEEDED_USER_MESSAGE
    assert predict._process_message.await_count == AnthropicPredict.MAX_TOOL_ROUNDS


@pytest.mark.unit
def test_handle_response_returns_none_when_final_response_has_no_text(predict: AnthropicPredict) -> None:
    """A final (no tool_use) response with no text content should be a controlled None,
    not an IndexError or a silently wrong reply."""
    response = _message([])

    result = asyncio.run(predict._handle_response(response, [], "user-1", "create"))

    assert result is None
