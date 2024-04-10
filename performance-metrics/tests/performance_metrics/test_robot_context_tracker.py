"""Tests for the RobotContextTracker class in performance_metrics.robot_context_tracker."""

import pytest
from performance_metrics.robot_context_tracker import RobotContextTracker
from performance_metrics.datashapes import RobotContextStates
from time import sleep

# Corrected times in seconds
STARTING_TIME = 0.001
CALIBRATING_TIME = 0.002
ANALYZING_TIME = 0.003
RUNNING_TIME = 0.004
SHUTTING_DOWN_TIME = 0.005


@pytest.fixture
def robot_context_tracker() -> RobotContextTracker:
    """Fixture to provide a fresh instance of RobotContextTracker for each test."""
    return RobotContextTracker()


def test_robot_context_tracker(robot_context_tracker: RobotContextTracker) -> None:
    """Tests the tracking of various robot context states through RobotContextTracker."""

    @robot_context_tracker.track(state=RobotContextStates.STARTING_UP)
    def starting_robot() -> None:
        sleep(STARTING_TIME)

    @robot_context_tracker.track(state=RobotContextStates.CALIBRATING)
    def calibrating_robot() -> None:
        sleep(CALIBRATING_TIME)

    @robot_context_tracker.track(state=RobotContextStates.ANALYZING_PROTOCOL)
    def analyzing_protocol() -> None:
        sleep(ANALYZING_TIME)

    @robot_context_tracker.track(state=RobotContextStates.RUNNING_PROTOCOL)
    def running_protocol() -> None:
        sleep(RUNNING_TIME)

    @robot_context_tracker.track(state=RobotContextStates.SHUTTING_DOWN)
    def shutting_down_robot() -> None:
        sleep(SHUTTING_DOWN_TIME)

    # Ensure storage is initially empty
    assert (
        len(robot_context_tracker._storage) == 0
    ), "Storage should be initially empty."

    starting_robot()
    calibrating_robot()
    analyzing_protocol()
    running_protocol()
    shutting_down_robot()

    # Verify that all states were tracked
    assert len(robot_context_tracker._storage) == 5, "All states should be tracked."

    # Validate the sequence and accuracy of tracked states
    expected_states = [
        RobotContextStates.STARTING_UP,
        RobotContextStates.CALIBRATING,
        RobotContextStates.ANALYZING_PROTOCOL,
        RobotContextStates.RUNNING_PROTOCOL,
        RobotContextStates.SHUTTING_DOWN,
    ]
    for i, state in enumerate(expected_states):
        assert (
            RobotContextStates.from_id(robot_context_tracker._storage[i].state.state_id)
            == state
        ), f"State at index {i} should be {state}."
