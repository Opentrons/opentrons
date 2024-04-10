import pytest
from performance_metrics.robot_context_tracker import RobotContextTracker
from performance_metrics.datashapes import RobotContextStates
from time import sleep

# In milliseconds
STARTING_TIME = 1 // 1000.0
CALIBRATING_TIME = 2 // 1000.0
ANALYZING_TIME = 3 // 1000.0
RUNNING_TIME = 4 // 1000.0
SHUTTING_DOWN_TIME = 5 // 1000.0


@pytest.fixture
def robot_context_tracker() -> RobotContextTracker:
    return RobotContextTracker()


def test_robot_context_tracker(robot_context_tracker: RobotContextTracker) -> None:
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

    assert len(robot_context_tracker._storage) == 0
    starting_robot()
    assert len(robot_context_tracker._storage) == 1
    calibrating_robot()
    assert len(robot_context_tracker._storage) == 2
    analyzing_protocol()
    assert len(robot_context_tracker._storage) == 3
    running_protocol()
    assert len(robot_context_tracker._storage) == 4
    shutting_down_robot()

    assert len(robot_context_tracker._storage) == 5
    assert (
        RobotContextStates.from_id(robot_context_tracker._storage[0].state)
        == RobotContextStates.STARTING_UP
    )
    assert (
        RobotContextStates.from_id(robot_context_tracker._storage[1].state)
        == RobotContextStates.CALIBRATING
    )
    assert (
        RobotContextStates.from_id(robot_context_tracker._storage[2].state)
        == RobotContextStates.ANALYZING_PROTOCOL
    )
    assert (
        RobotContextStates.from_id(robot_context_tracker._storage[3].state)
        == RobotContextStates.RUNNING_PROTOCOL
    )
    assert (
        RobotContextStates.from_id(robot_context_tracker._storage[4].state)
        == RobotContextStates.SHUTTING_DOWN
    )
