"""Tests for the RobotContextTracker class in performance_metrics.robot_context_tracker."""

import asyncio
from pathlib import Path
import pytest
from performance_metrics.robot_context_tracker import RobotContextTracker
from opentrons_shared_data.performance.dev_types import RobotContextState
from time import sleep, time_ns
from unittest.mock import patch

# Corrected times in seconds
STARTING_TIME = 0.001
CALIBRATING_TIME = 0.002
ANALYZING_TIME = 0.003
RUNNING_TIME = 0.004
SHUTTING_DOWN_TIME = 0.005


@pytest.fixture
def robot_context_tracker(tmp_path: Path) -> RobotContextTracker:
    """Fixture to provide a fresh instance of RobotContextTracker for each test."""
    return RobotContextTracker(storage_location=tmp_path, should_track=True)


async def test_robot_context_tracker(
    robot_context_tracker: RobotContextTracker,
) -> None:
    """Tests the tracking of various robot context states through RobotContextTracker."""

    def starting_robot() -> None:
        sleep(STARTING_TIME)

    def calibrating_robot() -> None:
        sleep(CALIBRATING_TIME)

    def analyzing_protocol() -> None:
        sleep(ANALYZING_TIME)

    def running_protocol() -> None:
        sleep(RUNNING_TIME)

    def shutting_down_robot() -> None:
        sleep(SHUTTING_DOWN_TIME)

    # Ensure storage is initially empty
    assert (
        len(robot_context_tracker._store._data) == 0
    ), "Storage should be initially empty."

    await robot_context_tracker.track(
        starting_robot, state=RobotContextState.STARTING_UP
    )
    await robot_context_tracker.track(
        calibrating_robot, state=RobotContextState.CALIBRATING
    )
    await robot_context_tracker.track(
        analyzing_protocol, state=RobotContextState.ANALYZING_PROTOCOL
    )
    await robot_context_tracker.track(
        running_protocol, state=RobotContextState.RUNNING_PROTOCOL
    )
    await robot_context_tracker.track(
        shutting_down_robot, state=RobotContextState.SHUTTING_DOWN
    )

    # Verify that all states were tracked
    assert len(robot_context_tracker._store._data) == 5, "All states should be tracked."

    # Validate the sequence and accuracy of tracked states
    expected_states = [
        RobotContextState.STARTING_UP,
        RobotContextState.CALIBRATING,
        RobotContextState.ANALYZING_PROTOCOL,
        RobotContextState.RUNNING_PROTOCOL,
        RobotContextState.SHUTTING_DOWN,
    ]
    for i, state in enumerate(expected_states):
        assert (
            RobotContextState.from_id(
                robot_context_tracker._store._data[i].state.state_id
            )
            == state
        ), f"State at index {i} should be {state}."


async def test_multiple_operations_single_state(
    robot_context_tracker: RobotContextTracker,
) -> None:
    """Tests tracking multiple operations within a single robot context state."""

    def first_operation() -> None:
        sleep(RUNNING_TIME)

    def second_operation() -> None:
        sleep(RUNNING_TIME)

    await robot_context_tracker.track(
        first_operation, state=RobotContextState.RUNNING_PROTOCOL
    )
    await robot_context_tracker.track(
        second_operation, state=RobotContextState.RUNNING_PROTOCOL
    )

    assert (
        len(robot_context_tracker._store._data) == 2
    ), "Both operations should be tracked."
    assert (
        robot_context_tracker._store._data[0].state
        == robot_context_tracker._store._data[1].state
        == RobotContextState.RUNNING_PROTOCOL
    ), "Both operations should have the same state."


async def test_exception_handling_in_tracked_function(
    robot_context_tracker: RobotContextTracker,
) -> None:
    """Ensures exceptions in tracked operations are handled correctly."""

    async def error_prone_operation() -> None:
        sleep(SHUTTING_DOWN_TIME)
        raise RuntimeError("Simulated operation failure")

    with pytest.raises(RuntimeError):
        await robot_context_tracker.track(
            error_prone_operation, state=RobotContextState.SHUTTING_DOWN
        )

    assert (
        len(robot_context_tracker._store._data) == 1
    ), "Failed operation should still be tracked."
    assert (
        robot_context_tracker._store._data[0].state == RobotContextState.SHUTTING_DOWN
    ), "State should be correctly logged despite the exception."


@pytest.mark.asyncio
async def test_async_operation_tracking(
    robot_context_tracker: RobotContextTracker,
) -> None:
    """Tests tracking of an asynchronous operation."""

    async def async_analyzing_operation() -> None:
        await asyncio.sleep(ANALYZING_TIME)

    await robot_context_tracker.track(
        async_analyzing_operation, state=RobotContextState.ANALYZING_PROTOCOL
    )

    assert (
        len(robot_context_tracker._store._data) == 1
    ), "Async operation should be tracked."
    assert (
        robot_context_tracker._store._data[0].state
        == RobotContextState.ANALYZING_PROTOCOL
    ), "State should be ANALYZING_PROTOCOL."


def test_sync_operation_timing_accuracy(
    robot_context_tracker: RobotContextTracker,
) -> None:
    """Tests the timing accuracy of a synchronous operation tracking."""

    def running_operation() -> None:
        sleep(RUNNING_TIME)

    asyncio.run(
        robot_context_tracker.track(
            running_operation, state=RobotContextState.RUNNING_PROTOCOL
        )
    )

    duration_data = robot_context_tracker._store._data[0]
    assert (
        abs(duration_data.duration - RUNNING_TIME * 1e9) < 1e7
    ), "Measured duration for sync operation should closely match the expected duration."


@pytest.mark.asyncio
async def test_async_operation_timing_accuracy(
    robot_context_tracker: RobotContextTracker,
) -> None:
    """Tests the timing accuracy of an async operation tracking."""

    async def async_running_operation() -> None:
        await asyncio.sleep(RUNNING_TIME)

    await robot_context_tracker.track(
        async_running_operation, state=RobotContextState.RUNNING_PROTOCOL
    )

    duration_data = robot_context_tracker._store._data[0]
    assert (
        abs(duration_data.duration - RUNNING_TIME * 1e9) < 1e7
    ), "Measured duration for async operation should closely match the expected duration."


@pytest.mark.asyncio
async def test_exception_in_async_operation(
    robot_context_tracker: RobotContextTracker,
) -> None:
    """Ensures exceptions in tracked async operations are correctly handled."""

    async def async_error_prone_operation() -> None:
        await asyncio.sleep(SHUTTING_DOWN_TIME)
        raise RuntimeError("Simulated async operation failure")

    with pytest.raises(RuntimeError):
        await robot_context_tracker.track(
            async_error_prone_operation, state=RobotContextState.SHUTTING_DOWN
        )

    assert (
        len(robot_context_tracker._store._data) == 1
    ), "Failed async operation should still be tracked."
    assert (
        robot_context_tracker._store._data[0].state == RobotContextState.SHUTTING_DOWN
    ), "State should be SHUTTING_DOWN despite the exception."


@pytest.mark.asyncio
async def test_concurrent_async_operations(
    robot_context_tracker: RobotContextTracker,
) -> None:
    """Tests tracking of concurrent async operations."""

    async def first_async_calibrating() -> None:
        await asyncio.sleep(CALIBRATING_TIME)

    async def second_async_calibrating() -> None:
        await asyncio.sleep(CALIBRATING_TIME)

    await asyncio.gather(
        robot_context_tracker.track(
            first_async_calibrating, state=RobotContextState.CALIBRATING
        ),
        robot_context_tracker.track(
            second_async_calibrating, state=RobotContextState.CALIBRATING
        ),
    )

    assert (
        len(robot_context_tracker._store._data) == 2
    ), "Both concurrent async operations should be tracked."
    assert all(
        data.state == RobotContextState.CALIBRATING
        for data in robot_context_tracker._store._data
    ), "All tracked operations should be in CALIBRATING state."


def test_no_tracking(tmp_path: Path) -> None:
    """Tests that operations are not tracked when tracking is disabled."""
    robot_context_tracker = RobotContextTracker(tmp_path, should_track=False)

    def operation_without_tracking() -> None:
        sleep(STARTING_TIME)

    asyncio.run(
        robot_context_tracker.track(
            operation_without_tracking, state=RobotContextState.STARTING_UP
        )
    )

    assert (
        len(robot_context_tracker._store._data) == 0
    ), "Operation should not be tracked when tracking is disabled."


def test_async_exception_handling_when_not_tracking(tmp_path: Path) -> None:
    """Ensures exceptions in operations are still raised when tracking is disabled."""
    robot_context_tracker = RobotContextTracker(tmp_path, should_track=False)

    async def error_prone_operation() -> None:
        sleep(SHUTTING_DOWN_TIME)
        raise RuntimeError("Simulated operation failure")

    with pytest.raises(RuntimeError):
        asyncio.run(
            robot_context_tracker.track(
                error_prone_operation, state=RobotContextState.SHUTTING_DOWN
            )
        )


def test_sync_exception_handling_when_not_tracking(tmp_path: Path) -> None:
    """Ensures exceptions in operations are still raised when tracking is disabled."""
    robot_context_tracker = RobotContextTracker(tmp_path, should_track=False)

    def error_prone_operation() -> None:
        sleep(SHUTTING_DOWN_TIME)
        raise RuntimeError("Simulated operation failure")

    with pytest.raises(RuntimeError):
        asyncio.run(
            robot_context_tracker.track(
                error_prone_operation, state=RobotContextState.SHUTTING_DOWN
            )
        )


@patch(
    "performance_metrics.robot_context_tracker._get_timing_function",
    return_value=time_ns,
)
def test_using_non_linux_time_functions(tmp_path: Path) -> None:
    """Tests tracking operations using non-Linux time functions."""
    file_path = tmp_path / "test_file.csv"
    robot_context_tracker = RobotContextTracker(file_path, should_track=True)

    def starting_robot() -> None:
        sleep(STARTING_TIME)

    def calibrating_robot() -> None:
        sleep(CALIBRATING_TIME)

    asyncio.run(
        robot_context_tracker.track(starting_robot, state=RobotContextState.STARTING_UP)
    )
    asyncio.run(
        robot_context_tracker.track(
            calibrating_robot, state=RobotContextState.CALIBRATING
        )
    )

    storage = robot_context_tracker._store._data
    assert all(
        data.func_start > 0 for data in storage
    ), "All function start times should be greater than 0."
    assert all(
        data.duration > 0 for data in storage
    ), "All duration times should be greater than 0."
    assert len(storage) == 2, "Both operations should be tracked."
