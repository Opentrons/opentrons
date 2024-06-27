"""Tests for the metrics store."""

from pathlib import Path
from time import sleep

from opentrons_shared_data.performance.dev_types import RobotContextState
from performance_metrics.datashapes import RawContextData
from performance_metrics.robot_context_tracker import RobotContextTracker

# Corrected times in seconds
STARTING_TIME = 0.001
CALIBRATING_TIME = 0.002
ANALYZING_TIME = 0.003
RUNNING_TIME = 0.004
SHUTTING_DOWN_TIME = 0.005


async def test_storing_to_file(tmp_path: Path) -> None:
    """Tests storing the tracked data to a file."""
    robot_context_tracker = RobotContextTracker(tmp_path, should_track=True)

    @robot_context_tracker.track(state=RobotContextState.STARTING_UP)
    def starting_robot() -> None:
        sleep(STARTING_TIME)

    @robot_context_tracker.track(state=RobotContextState.CALIBRATING)
    def calibrating_robot() -> None:
        sleep(CALIBRATING_TIME)

    @robot_context_tracker.track(state=RobotContextState.ANALYZING_PROTOCOL)
    def analyzing_protocol() -> None:
        sleep(ANALYZING_TIME)

    starting_robot()
    calibrating_robot()
    analyzing_protocol()

    robot_context_tracker.store()

    with open(robot_context_tracker._store.metadata.data_file_location, "r") as file:
        lines = file.readlines()
        assert len(lines) == 3, "All stored data should be written to the file."

        split_lines: list[list[str]] = [line.strip().split(",") for line in lines]
        assert all(
            RawContextData.from_csv_row(line) for line in split_lines
        ), "All lines should be valid RawContextData instances."

    with open(robot_context_tracker._store.metadata.headers_file_location, "r") as file:
        headers = file.readlines()
        assert len(headers) == 1, "Header should be written to the headers file."
        assert tuple(headers[0].strip().split(",")) == RawContextData.headers()
