"""Tests for the module build retry/backoff helper."""

import asyncio

import pytest

from opentrons.drivers.asyncio.communication.errors import NoResponse
from opentrons.drivers.utils import ParseError
from opentrons.hardware_control.modules import retry as retry_module
from opentrons.hardware_control.modules.retry import (
    MODULE_BUILD_RETRIES,
    retry_module_init,
)


@pytest.fixture
def fast_backoff(monkeypatch: pytest.MonkeyPatch) -> None:
    """Patch the retry backoff to be effectively instant."""
    monkeypatch.setattr(retry_module, "MODULE_BUILD_INITIAL_BACKOFF_S", 0)
    monkeypatch.setattr(retry_module, "MODULE_BUILD_MAX_BACKOFF_S", 0)
    monkeypatch.setattr(asyncio, "sleep", lambda _: _noop())


async def _noop() -> None:
    return None


async def test_returns_on_first_success(fast_backoff: None) -> None:
    """It should return the factory result when it succeeds immediately."""

    async def factory() -> str:
        return "ok"

    result = await retry_module_init(factory, port="/dev/test")

    assert result == "ok"


async def test_retries_on_parse_error_then_succeeds(
    fast_backoff: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    """It should retry on ParseError and return once the factory succeeds."""
    call_count = 0

    async def factory() -> str:
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            raise ParseError(error_message="Missing key 'model'", parse_source="")
        return "ok"

    result = await retry_module_init(factory, port="/dev/test")

    assert result == "ok"
    assert call_count == 3


async def test_retries_on_no_response_then_succeeds(
    fast_backoff: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    """It should retry on NoResponse (ack timeout) and return on success."""
    call_count = 0

    async def factory() -> str:
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise NoResponse(port="/dev/test", command="M115")
        return "ok"

    result = await retry_module_init(factory, port="/dev/test")

    assert result == "ok"
    assert call_count == 2


async def test_raises_after_exhausting_retries(fast_backoff: None) -> None:
    """It should re-raise the last retryable error after all attempts fail."""
    call_count = 0

    async def factory() -> str:
        nonlocal call_count
        call_count += 1
        raise ParseError(error_message="always fails", parse_source="")

    with pytest.raises(ParseError, match="always fails"):
        await retry_module_init(factory, port="/dev/test")

    assert call_count == MODULE_BUILD_RETRIES


async def test_does_not_retry_non_retryable_error(fast_backoff: None) -> None:
    """It should not retry on exceptions outside the retryable set."""
    call_count = 0

    async def factory() -> str:
        nonlocal call_count
        call_count += 1
        raise ValueError("not retryable")

    with pytest.raises(ValueError, match="not retryable"):
        await retry_module_init(factory, port="/dev/test")

    assert call_count == 1


async def test_factory_cleanup_called_between_attempts(
    fast_backoff: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The factory is responsible for cleaning up on failure.

    This documents the contract: the factory's own except block runs before
    the retry sleep, so partially-constructed drivers get torn down each time.
    """
    cleanup_calls: list[BaseException] = []

    async def factory() -> str:
        try:
            raise ParseError(error_message="boom", parse_source="")
        except ParseError as e:
            cleanup_calls.append(e)
            raise

    with pytest.raises(ParseError):
        await retry_module_init(factory, port="/dev/test")

    assert len(cleanup_calls) == MODULE_BUILD_RETRIES
