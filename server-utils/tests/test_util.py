import asyncio
from datetime import timedelta, datetime

import pytest
from mock import patch
from typing import Any, Iterator

from server_utils import util


@pytest.fixture
def mock_start_time() -> datetime:
    return datetime(2020, 5, 1)


@pytest.fixture
def mock_utc_now(mock_start_time: datetime) -> Iterator[datetime]:
    """Mock util.utc_now.

    First call will be mock_start_time. Subsequent calls will increment by
    1 day."""

    class _TimeIncrementer:
        def __init__(self, t: datetime):
            self._time = t

        def __call__(self, *args: Any, **kwargs: Any) -> datetime:
            ret = self._time
            self._time += timedelta(days=1)
            return ret

    with patch.object(util, "_utc_now") as p:
        p.side_effect = _TimeIncrementer(mock_start_time)
        yield p


def test_duration(mock_utc_now: datetime, mock_start_time: datetime) -> None:
    with util.duration() as t:
        pass

    assert t.start == mock_start_time
    assert t.end == mock_start_time + timedelta(days=1)


def test_duration_raises(mock_utc_now: datetime, mock_start_time: datetime) -> None:
    try:
        with util.duration() as t:
            raise AssertionError()
    except AssertionError:
        pass

    assert t.start == mock_start_time
    assert t.end == mock_start_time + timedelta(days=1)


async def test_call_once_retains_first_return_value() -> None:
    class ReturnType:
        def __init__(self, arg: int) -> None:
            self.arg = arg

    @util.call_once
    async def to_be_called_once(arg: int) -> ReturnType:
        return ReturnType(arg)

    result_1 = await to_be_called_once(1)
    result_2 = await to_be_called_once(2)

    # It should return the same object each time.
    assert result_1 is result_2

    # That object should be the one returned by the first call.
    assert result_1.arg == result_2.arg == 1


async def test_call_once_is_async_safe() -> None:
    times_called = 0

    @util.call_once
    async def to_be_called_once() -> None:
        # Give multiple calls a chance to run concurrently with each other.
        await asyncio.sleep(0.01)

        nonlocal times_called
        times_called += 1

    # Call the function a bunch of times to run concurrently.
    await asyncio.gather(*[to_be_called_once() for _ in range(100)])

    # Assert that the function body only actually executed one time.
    assert times_called == 1
