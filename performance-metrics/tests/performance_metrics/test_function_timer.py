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
