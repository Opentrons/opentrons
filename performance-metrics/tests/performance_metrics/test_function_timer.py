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
    with FunctionTimer() as tracker:
        synchronous_function()

    time = tracker.get_time()
    assert time.start_time < time.end_time


def test_synchronous_function_with_exception() -> None:
    """Tests that FunctionTimer can handle exceptions in synchronous functions correctly."""
    with pytest.raises(Exception):
        with FunctionTimer() as tracker:
            synchronous_function_with_exception()
        time = tracker.get_time()
        assert time.start_time < time.end_time


async def test_asynchronous_function() -> None:
    """Tests that the asynchronous function is timed correctly by FunctionTimer."""
    async with FunctionTimer() as tracker:
        await asynchronous_function()

    time = tracker.get_time()
    assert time.start_time < time.end_time


async def test_asynchronous_function_with_exception() -> None:
    """Tests that FunctionTimer can handle exceptions in asynchronous functions correctly."""
    with pytest.raises(Exception):
        async with FunctionTimer() as tracker:
            await asynchronous_function_with_exception()

    time = tracker.get_time()
    assert time.start_time < time.end_time


async def test_asynchronous_and_synchronous_function() -> None:
    """Tests the timing of a mixed sequence of synchronous and asynchronous functions with FunctionTimer."""
    async with FunctionTimer() as tracker:
        synchronous_function()
        await asynchronous_function()

    time = tracker.get_time()
    assert time.start_time < time.end_time


async def test_synchronous_and_asynchronous_function_with_exception() -> None:
    """Tests that FunctionTimer can handle a mixed sequence of functions, including an exception, correctly."""
    with pytest.raises(Exception):
        async with FunctionTimer() as tracker:
            synchronous_function_with_exception()
            await asynchronous_function()

        time = tracker.get_time()
        assert time.start_time < time.end_time

async def test_nested_synchronous_functions() -> None:
    """Tests that the FunctionTimer correctly times nested synchronous functions."""
    with FunctionTimer() as outer_tracker:
        synchronous_function()
        with FunctionTimer() as inner_tracker:
            synchronous_function()

    outer_time = outer_tracker.get_time()
    inner_time = inner_tracker.get_time()

    assert outer_time.start_time < outer_time.end_time
    assert inner_time.start_time < inner_time.end_time
    assert outer_time.start_time < inner_time.start_time
    assert outer_time.end_time > inner_time.end_time

async def test_timing_sychronous_function_nested_inside_async_function() -> None:
    """Tests that the FunctionTimer correctly times a synchronous function inside an asynchronous context manager."""
    async with FunctionTimer() as async_tracker:
        await asynchronous_function()
        with FunctionTimer() as sync_tracker:
            synchronous_function()

    async_time = async_tracker.get_time()
    sync_time = sync_tracker.get_time()

    assert async_time.start_time < async_time.end_time
    assert sync_time.start_time < sync_time.end_time
    assert async_time.start_time < sync_time.start_time
    assert async_time.end_time > sync_time.end_time


def test_instantaneous_function() -> None:
    """Tests that the FunctionTimer can measure the time of an almost instantaneous function."""

    def instantaneous_function() -> None:
        """A function that executes almost instantaneously."""
        pass

    with FunctionTimer() as tracker:
        instantaneous_function()

    time = tracker.get_time()
    assert time.start_time <= time.end_time


def test_known_duration_function() -> None:
    """Tests the FunctionTimer's accuracy by comparing with a known sleep duration."""
    sleep_duration = 0.5

    def known_duration_function() -> None:
        time.sleep(sleep_duration)

    with FunctionTimer() as tracker:
        known_duration_function()

    time_info = tracker.get_time()
    measured_duration = (time_info.end_time - time_info.start_time).total_seconds()
    assert abs(measured_duration - sleep_duration) < 0.05


async def test_async_functions_in_parallel() -> None:
    """Tests timing of multiple asynchronous functions executed in parallel."""

    async def async_sleep_function(duration: float) -> None:
        await asyncio.sleep(duration)

    async with FunctionTimer() as tracker:
        await asyncio.gather(
            async_sleep_function(0.5),
            async_sleep_function(1),
            async_sleep_function(1.5),
        )

    time = tracker.get_time()
    assert time.start_time < time.end_time


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

    f1_time = f1_timer.get_time()
    f2_time = f2_timer.get_time()

    assert f1_time.start_time < f1_time.end_time
    assert f2_time.start_time < f2_time.end_time
    assert f1_time.start_time < f2_time.start_time
    assert f1_time.end_time > f2_time.end_time

def test_direct_use_without_context_manager():
    timer = FunctionTimer()
    assert timer._start_time is None
    assert timer._end_time is None
    
    with pytest.raises(AssertionError):
        timer.get_time()

def test_calling_get_time_before_context_manager_finishes():
    with pytest.raises(AssertionError):
        with FunctionTimer() as timer:
            synchronous_function()
            timer.get_time()

