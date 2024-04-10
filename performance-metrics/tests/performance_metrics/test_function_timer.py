"""This module contains tests for the FunctionTimer class, focusing on its ability to accurately measure and record the execution times of synchronous and asynchronous functions, including when exceptions are raised."""

import asyncio
from typing import List
from performance_metrics.datashapes import RawDurationData
import pytest
from time import sleep
from performance_metrics.function_timer import (
    FunctionTimer,
)


@pytest.fixture
def temp_storage() -> List[RawDurationData]:
    """Creates a temporary storage list for testing."""
    return []


@pytest.fixture
def function_timer(temp_storage: List[RawDurationData]) -> FunctionTimer:
    """Creates a FunctionTimer instance with a mock storage function for testing."""
    return FunctionTimer(temp_storage.append)  # type: ignore


def test_sync_function(
    temp_storage: List[RawDurationData], function_timer: FunctionTimer
) -> None:
    """Tests accurate measurement of a synchronous function's execution time."""

    @function_timer.measure_duration
    def sync_test() -> None:
        sleep(0.01)

    sync_test()
    raw_data = temp_storage[0]
    assert (
        raw_data.duration_measurement_start_time
        < raw_data.duration_measurement_end_time
    )


@pytest.mark.asyncio
async def test_async_function(
    temp_storage: List[RawDurationData], function_timer: FunctionTimer
) -> None:
    """Tests accurate measurement of an asynchronous function's execution time."""

    @function_timer.measure_duration
    async def async_test() -> None:
        await asyncio.sleep(0.01)

    await async_test()
    raw_data = temp_storage[0]
    assert (
        raw_data.duration_measurement_start_time
        < raw_data.duration_measurement_end_time
    )


def test_sync_function_exception(
    temp_storage: List[RawDurationData], function_timer: FunctionTimer
) -> None:
    """Tests duration measurement of a synchronous function that raises an exception."""

    @function_timer.measure_duration
    def sync_test_exception() -> None:
        sleep(0.01)
        raise ValueError("Intentional Error")

    with pytest.raises(ValueError):
        sync_test_exception()
    raw_data = temp_storage[0]
    assert (
        raw_data.duration_measurement_start_time
        < raw_data.duration_measurement_end_time
    )


@pytest.mark.asyncio
async def test_async_function_exception(
    temp_storage: List[RawDurationData], function_timer: FunctionTimer
) -> None:
    """Tests duration measurement of an asynchronous function that raises an exception."""

    @function_timer.measure_duration
    async def async_test_exception() -> None:
        await asyncio.sleep(0.01)
        raise ValueError("Intentional Error")

    with pytest.raises(ValueError):
        await async_test_exception()
    raw_data = temp_storage[0]
    assert (
        raw_data.duration_measurement_start_time
        < raw_data.duration_measurement_end_time
    )


def test_sync_function_multiple_calls(
    temp_storage: List[RawDurationData], function_timer: FunctionTimer
) -> None:
    """Tests duration measurement of multiple calls to a synchronous function."""

    @function_timer.measure_duration
    def sync_test_multiple_calls() -> None:
        sleep(0.01)

    sync_test_multiple_calls()
    sync_test_multiple_calls()

    row_1 = temp_storage[0]
    row_2 = temp_storage[1]

    assert row_1.duration_measurement_start_time < row_1.duration_measurement_end_time
    assert row_2.duration_measurement_start_time < row_2.duration_measurement_end_time
    assert row_1.duration_measurement_end_time < row_2.duration_measurement_start_time


@pytest.mark.asyncio
async def test_concurrent_async_functions(
    temp_storage: List[RawDurationData], function_timer: FunctionTimer
) -> None:
    """Tests that the function timer accurately measures execution times of concurrently executed asynchronous functions."""

    @function_timer.measure_duration
    async def concurrent_function() -> None:
        await asyncio.sleep(0.01)

    await asyncio.gather(concurrent_function(), concurrent_function())

    assert len(temp_storage) == 2, "Two entries should be recorded."
    for raw_data in temp_storage:
        assert (
            raw_data.duration_measurement_end_time
            - raw_data.duration_measurement_start_time
        ) > 0, "Duration should be positive for each concurrent function."


def test_instant_function(
    temp_storage: List[RawDurationData], function_timer: FunctionTimer
) -> None:
    """Tests the function timer with a function that completes almost instantaneously."""

    @function_timer.measure_duration
    def instant_function() -> None:
        pass  # Do nothing

    instant_function()
    assert (
        temp_storage[0].duration_measurement_end_time
        >= temp_storage[0].duration_measurement_start_time
    ), "End time should be greater than or equal to start time."


def test_timing_accuracy(
    temp_storage: List[RawDurationData], function_timer: FunctionTimer
) -> None:
    """Tests the accuracy of the function timer against a known duration."""
    known_duration = 0.01  # 10ms
    tolerance = 0.0005  # 0.5ms tolerance

    @function_timer.measure_duration
    def test_function() -> None:
        sleep(known_duration)

    test_function()
    measured_duration = (
        temp_storage[0].duration_measurement_end_time
        - temp_storage[0].duration_measurement_start_time
    ) / 1e9
    assert (
        abs(measured_duration - known_duration) <= tolerance
    ), "Measured duration is within tolerance of the known duration."


def test_timing_precision(
    temp_storage: List[RawDurationData], function_timer: FunctionTimer
) -> None:
    """Tests the precision of the timing mechanism for very short durations."""

    @function_timer.measure_duration
    def precise_function() -> None:
        sleep(0.001)  # Sleep for 1ms

    precise_function()
    duration = (
        temp_storage[0].duration_measurement_end_time
        - temp_storage[0].duration_measurement_start_time
    )
    assert duration > 0, "Duration should be positive indicating the timer's precision."
