"""This module contains tests for timing the execution of synchronous and asynchronous functions using the FunctionTimer class.

It includes functions and their variants that raise exceptions to simulate errors during execution. Each test function is designed
to ensure the FunctionTimer accurately measures execution times and handles exceptions correctly for both synchronous and asynchronous
calls. This serves as a comprehensive suite to validate the functionality of FunctionTimer in various scenarios.
"""
import time
import asyncio
import pytest
from performance_metrics.function_timer import FunctionTimer


def synchronous_function() -> None:
    """Prints a message indicating a synchronous function is running."""
    print("synchronous_function")


def synchronous_function_with_exception() -> None:
    """Prints a message then raises an exception to simulate error in synchronous execution."""
    print("synchronous_function_with_exception")
    raise Exception("An exception")


async def asynchronous_function() -> None:
    """Prints a message indicating an asynchronous function is running."""
    print("asynchronous_function")


async def asynchronous_function_with_exception() -> None:
    """Prints a message then raises an exception to simulate error in asynchronous execution."""
    print("asynchronous_function_with_exception")
    raise Exception("An exception")


async def long_running_task() -> None:
    """Simulates a longer running asynchronous task."""
    await asyncio.sleep(2)


async def short_running_task() -> None:
    """Simulates a shorter running asynchronous task."""
    await asyncio.sleep(0.5)


##################
# TEST FUNCTIONS #
##################


def test_synchronous_function() -> None:
    """Tests that the synchronous function is timed correctly by FunctionTimer."""
    with FunctionTimer() as timer:
        synchronous_function()

    duration_data = timer.get_data()
    assert duration_data.duration_start < duration_data.duration_end


def test_synchronous_function_with_exception() -> None:
    """Tests that FunctionTimer can handle exceptions in synchronous functions correctly."""
    with pytest.raises(Exception):
        with FunctionTimer() as timer:
            synchronous_function_with_exception()

    duration_data = timer.get_data()
    assert duration_data.duration_start < duration_data.duration_end

async def test_asynchronous_function() -> None:
    """Tests that the asynchronous function is timed correctly by FunctionTimer."""
    async with FunctionTimer() as timer:
        await asynchronous_function()

async def test_asynchronous_function() -> None:
    """Tests that the asynchronous function is timed correctly by FunctionTimer."""
    async with FunctionTimer() as timer:
        await asynchronous_function()

    duration_data = timer.get_data()
    assert duration_data.duration_start < duration_data.duration_end


async def test_asynchronous_function_with_exception() -> None:
    """Tests that FunctionTimer can handle exceptions in asynchronous functions correctly."""
    with pytest.raises(Exception):
        async with FunctionTimer() as timer:
            await asynchronous_function_with_exception()

    duration_data = timer.get_data()
    assert duration_data.duration_start < duration_data.duration_end

async def test_asynchronous_and_synchronous_function() -> None:
    """Tests the timing of a mixed sequence of synchronous and asynchronous functions with FunctionTimer."""
    async with FunctionTimer() as timer:
        synchronous_function()
        await asynchronous_function()

async def test_asynchronous_and_synchronous_function() -> None:
    """Tests the timing of a mixed sequence of synchronous and asynchronous functions with FunctionTimer."""
    async with FunctionTimer() as timer:
        synchronous_function()
        await asynchronous_function()

    duration_data = timer.get_data()
    assert duration_data.duration_start < duration_data.duration_end


async def test_synchronous_and_asynchronous_function_with_exception() -> None:
    """Tests that FunctionTimer can handle a mixed sequence of functions, including an exception, correctly."""
    with pytest.raises(Exception):
        async with FunctionTimer() as timer:
            synchronous_function_with_exception()
            await asynchronous_function()

    duration_data = timer.get_data()
    assert duration_data.duration_start < duration_data.duration_end


async def test_nested_synchronous_functions() -> None:
    """Tests that the FunctionTimer correctly times nested synchronous functions."""
    with FunctionTimer() as outer_timer:
        synchronous_function()
        with FunctionTimer() as inner_timer:
            synchronous_function()

    outer_duration_data = outer_timer.get_data()
    inner_duration_data = inner_timer.get_data()

    assert outer_duration_data.duration_start < outer_duration_data.duration_end
    assert inner_duration_data.duration_start < inner_duration_data.duration_end
    assert outer_duration_data.duration_start < inner_duration_data.duration_start
    assert outer_duration_data.duration_end >= inner_duration_data.duration_end


async def test_timing_sychronous_function_nested_inside_async_function() -> None:
    """Tests that the FunctionTimer correctly times a synchronous function inside an asynchronous context manager."""
    async with FunctionTimer() as async_timer:
        await asynchronous_function()
        with FunctionTimer() as sync_timer:
            synchronous_function()

    async_duration_data = async_timer.get_data()
    sync_duration_data = sync_timer.get_data()

    assert async_duration_data.duration_start < async_duration_data.duration_end
    assert sync_duration_data.duration_start < sync_duration_data.duration_end
    assert async_duration_data.duration_start < sync_duration_data.duration_start
    assert async_duration_data.duration_end >= sync_duration_data.duration_end


def test_instantaneous_function() -> None:
    """Tests that the FunctionTimer can measure the time of an almost instantaneous function."""

    def instantaneous_function() -> None:
        """A function that executes almost instantaneously."""
        pass

    with FunctionTimer() as timer:
        instantaneous_function()

    duration_data = timer.get_data()
    assert duration_data.duration_start <= duration_data.duration_end


def test_known_duration_function() -> None:
    """Tests the FunctionTimer's accuracy by comparing with a known sleep duration."""
    sleep_duration = 0.5

    def known_duration_function() -> None:
        time.sleep(sleep_duration)

    with FunctionTimer() as timer:
        known_duration_function()

    duration_data = timer.get_data()
    measured_duration_nanoseconds = abs(
        duration_data.duration_start - duration_data.duration_end
    )
    measure_duration_seconds = measured_duration_nanoseconds / 1_000_000_000
    assert abs(measure_duration_seconds - sleep_duration) < 0.05


async def test_async_functions_in_parallel() -> None:
    """Tests timing of multiple asynchronous functions executed in parallel."""

    async def async_sleep_function(duration: float) -> None:
        await asyncio.sleep(duration)

    async with FunctionTimer() as timer:
        await asyncio.gather(
            async_sleep_function(0.5),
            async_sleep_function(1),
            async_sleep_function(1.5),
        )

    duration_data = timer.get_data()
    assert duration_data.duration_start < duration_data.duration_end


async def test_function_timer_with_async_contexts() -> None:
    """Tests that the FunctionTimer context manager correctly times overlapping asynchronous tasks."""
    # 1. Start long_running_task
    # 2. __aenter__ will be called on long_running_task
    # 3. Start short_running_task
    # 4. __aenter__ will be called on short_running_task
    # 5. Finish short_running_task
    # 6. __aexit__ will be called on short_running_task
    # 7. Finish long_running_task
    # 8. __aexit__ will be called on long_running_task

    async with FunctionTimer() as f1_timer:
        await long_running_task()

        async with FunctionTimer() as f2_timer:
            await short_running_task()

    f1_duration_data = f1_timer.get_data()
    f2_duration_data = f2_timer.get_data()

    assert f1_duration_data.duration_start < f1_duration_data.duration_end
    assert f2_duration_data.duration_start < f2_duration_data.duration_end
    assert f1_duration_data.duration_start < f2_duration_data.duration_start
    assert f1_duration_data.duration_end >= f2_duration_data.duration_end


def test_direct_use_without_context_manager() -> None:
    """Tests the behavior of FunctionTimer when used directly without a context manager block.

    Verifies that the start and end times are not set and that an appropriate assertion is raised when attempting to access them.
    """
    timer = FunctionTimer()
    assert (
        timer._func_start_time is None
    ), "_func_start_time should be None when not used within a context manager"
    assert (
        timer._duration_start_time is None
    ), "_duration_start_time should be None when not used within a context manager"
    assert (
        timer._duration_end_time is None
    ), "_duration_end_time should be None when not used within a context manager"

    with pytest.raises(AssertionError):
        timer.get_data()


def test_calling_get_data_before_context_manager_finishes() -> None:
    """Tests that attempting to call get_data before the context manager has properly finished (exited) results in an assertion error.

    This simulates the scenario where get_data is called prematurely, ensuring the timer enforces correct usage patterns.
    """
    with pytest.raises(AssertionError):
        with FunctionTimer() as timer:
            synchronous_function()
            timer.get_data()
