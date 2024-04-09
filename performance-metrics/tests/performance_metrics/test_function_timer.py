"""This module contains tests for the FunctionTimer class, focusing on its ability to accurately measure and record the execution times of synchronous and asynchronous functions, including when exceptions are raised."""

import asyncio
import pytest
from time import sleep
from performance_metrics.function_timer import (
    FunctionTimer,
    CanStoreTimingResult,
    TimingResultStore,
)


@pytest.fixture
def timing_result_store() -> TimingResultStore:
    """Fixture that provides an empty list to store durations. This list is reset before each test."""
    return TimingResultStore()


@pytest.fixture
def function_timer(timing_result_store: CanStoreTimingResult) -> FunctionTimer:
    """Creates a FunctionTimer instance with a mock storage function for testing."""
    return FunctionTimer(can_store=timing_result_store)


def test_sync_function(
    function_timer: FunctionTimer, timing_result_store: TimingResultStore
) -> None:
    """Tests accurate measurement of a synchronous function's execution time."""

    @function_timer.measure_duration
    def sync_test() -> None:
        sleep(0.01)

    sync_test()
    assert len(timing_result_store) == 1
    assert timing_result_store[0][1] < timing_result_store[0][2]


@pytest.mark.asyncio
async def test_async_function(
    function_timer: FunctionTimer, timing_result_store: TimingResultStore
) -> None:
    """Tests accurate measurement of an asynchronous function's execution time."""

    @function_timer.measure_duration
    async def async_test() -> None:
        await asyncio.sleep(0.01)

    await async_test()
    assert len(timing_result_store) == 1
    assert timing_result_store[0][1] < timing_result_store[0][2]


def test_sync_function_exception(
    function_timer: FunctionTimer, timing_result_store: TimingResultStore
) -> None:
    """Tests duration measurement of a synchronous function that raises an exception."""

    @function_timer.measure_duration
    def sync_test_exception() -> None:
        sleep(0.01)
        raise ValueError("Intentional Error")

    with pytest.raises(ValueError):
        sync_test_exception()
    assert len(timing_result_store) == 1
    assert timing_result_store[0][1] < timing_result_store[0][2]


@pytest.mark.asyncio
async def test_async_function_exception(
    function_timer: FunctionTimer, timing_result_store: TimingResultStore
) -> None:
    """Tests duration measurement of an asynchronous function that raises an exception."""

    @function_timer.measure_duration
    async def async_test_exception() -> None:
        await asyncio.sleep(0.01)
        raise ValueError("Intentional Error")

    with pytest.raises(ValueError):
        await async_test_exception()
    assert len(timing_result_store) == 1
    assert timing_result_store[0][1] < timing_result_store[0][2]


def test_sync_function_multiple_calls(
    function_timer: FunctionTimer, timing_result_store: TimingResultStore
) -> None:
    """Tests duration measurement of multiple calls to a synchronous function."""

    @function_timer.measure_duration
    def sync_test_multiple_calls() -> None:
        sleep(0.01)

    sync_test_multiple_calls()
    sync_test_multiple_calls()
    assert len(timing_result_store) == 2
    assert timing_result_store[0][0] < timing_result_store[1][0]
    assert all(start < end for _, start, end in timing_result_store)


@pytest.mark.asyncio
async def test_async_function_multiple_calls(
    function_timer: FunctionTimer, timing_result_store: TimingResultStore
) -> None:
    """Tests duration measurement of multiple calls to an asynchronous function."""

    @function_timer.measure_duration
    async def async_test_multiple_calls() -> None:
        await asyncio.sleep(0.01)

    await async_test_multiple_calls()
    await async_test_multiple_calls()
    assert len(timing_result_store) == 2
    assert timing_result_store[0][0] < timing_result_store[1][0]
    assert all(start < end for _, start, end in timing_result_store)
