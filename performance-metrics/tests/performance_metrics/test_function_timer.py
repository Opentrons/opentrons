"""This module contains tests for the FunctionTimer class, focusing on its ability to accurately measure and record the execution times of synchronous and asynchronous functions, including when exceptions are raised."""

import asyncio
from typing import List
import pytest
from time import sleep
from performance_metrics.function_timer import FunctionTimer, StoreDuration


@pytest.fixture
def durations() -> List[int]:
    """Fixture that provides an empty list to store durations. This list is reset before each test."""
    return []


@pytest.fixture
def store_duration_mock(durations: List[int]) -> StoreDuration:
    """Provides a mock function for storing duration measurements. It appends durations to the provided list."""

    def _mock(start_time: int, end_time: int) -> None:
        durations.append(end_time - start_time)

    return _mock


@pytest.fixture
def function_timer(store_duration_mock: StoreDuration) -> FunctionTimer:
    """Creates a FunctionTimer instance with a mock storage function for testing."""
    return FunctionTimer(store_duration=store_duration_mock)


def test_sync_function(function_timer: FunctionTimer, durations: List[int]) -> None:
    """Tests accurate measurement of a synchronous function's execution time."""

    @function_timer.measure_duration
    def sync_test() -> None:
        sleep(0.01)

    sync_test()
    assert len(durations) == 1
    assert durations[0] > 0


@pytest.mark.asyncio
async def test_async_function(
    function_timer: FunctionTimer, durations: List[int]
) -> None:
    """Tests accurate measurement of an asynchronous function's execution time."""

    @function_timer.measure_duration
    async def async_test() -> None:
        await asyncio.sleep(0.01)

    await async_test()
    assert len(durations) == 1
    assert durations[0] > 0


def test_sync_function_exception(
    function_timer: FunctionTimer, durations: List[int]
) -> None:
    """Tests duration measurement of a synchronous function that raises an exception."""

    @function_timer.measure_duration
    def sync_test_exception() -> None:
        sleep(0.01)
        raise ValueError("Intentional Error")

    with pytest.raises(ValueError):
        sync_test_exception()
    assert len(durations) == 1
    assert durations[0] > 0


@pytest.mark.asyncio
async def test_async_function_exception(
    function_timer: FunctionTimer, durations: List[int]
) -> None:
    """Tests duration measurement of an asynchronous function that raises an exception."""

    @function_timer.measure_duration
    async def async_test_exception() -> None:
        await asyncio.sleep(0.01)
        raise ValueError("Intentional Error")

    with pytest.raises(ValueError):
        await async_test_exception()
    assert len(durations) == 1
    assert durations[0] > 0
